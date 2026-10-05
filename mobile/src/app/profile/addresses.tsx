import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  fetchUserAddresses,
  addUserAddress,
  deleteUserAddress,
  UserAddress,
} from '@/services/user';
import { getCurrentLocation } from '@/services/location';
import { calculateDeliveryForCustomer, isInvalidLocation } from '@/services/delivery';
import { LocationPickerMapModal } from '@/components/LocationPickerMapModal';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { restaurant, primaryColor } = useRestaurant();
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();

  const branches = (restaurant as any)?.branches || [];

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form states
  const [label, setLabel] = useState<string>('المنزل');
  const [streetName, setStreetName] = useState<string>('');
  const [buildingNumber, setBuildingNumber] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [apartment, setApartment] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [locating, setLocating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [isStaleLocation, setIsStaleLocation] = useState<boolean>(false);

  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
  }, [user?.phone]);

  const loadAddresses = async () => {
    setLoading(true);
    const list = await fetchUserAddresses();
    setAddresses(list);
    if (list.length === 0) {
      setShowAddForm(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Calculate delivery fee automatically whenever GPS / Map coordinates are set
  const liveDeliveryCalc = useMemo(() => {
    if (isInvalidLocation(lat, lng) || branches.length === 0) return null;
    return calculateDeliveryForCustomer(lat!, lng!, branches);
  }, [lat, lng, branches]);

  // Turn on GPS, capture location, calculate delivery fee, and open interactive map
  const handleFetchGPSAndOpenMap = async () => {
    setLocating(true);
    setIsStaleLocation(false);
    const coords = await getCurrentLocation();
    setLocating(false);

    if (coords) {
      setLat(coords.latitude);
      setLng(coords.longitude);
      if (coords.isStale) {
        setIsStaleLocation(true);
      }
      // Open the interactive map centered on the captured GPS coordinates
      setShowMapModal(true);
    } else {
      // Even if GPS signal is unavailable indoors, open the interactive map so customer can pick location
      setShowMapModal(true);
    }
  };

  const handleSaveAddress = async () => {
    if (isInvalidLocation(lat, lng)) {
      Alert.alert(
        language === 'ar' ? 'مطلوب تحديد الموقع على الخريطة' : 'Location Required',
        language === 'ar'
          ? 'يرجى الضغط على زر الـ GPS أو الخريطة لتحديد موقعك وحساب خدمة التوصيل أولاً'
          : 'Please pick your location via GPS or Map first to calculate delivery fee.',
        [
          {
            text: language === 'ar' ? 'فتح الخريطة الآن' : 'Open Map Now',
            onPress: () => setShowMapModal(true),
          },
          { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!streetName.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Info',
        language === 'ar' ? 'يرجى إدخال اسم الشارع' : 'Please enter the street name.'
      );
      return;
    }

    if (!buildingNumber.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Info',
        language === 'ar' ? 'يرجى إدخال رقم العمارة' : 'Please enter the building number.'
      );
      return;
    }

    if (!apartment.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Info',
        language === 'ar' ? 'يرجى إدخال رقم الشقة' : 'Please enter the apartment number.'
      );
      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        language === 'ar' ? 'بيانات ناقصة' : 'Missing Info',
        language === 'ar' ? 'يرجى إدخال رقم تليفون للتواصل' : 'Please enter a contact phone number.'
      );
      return;
    }

    const formattedDetails = [
      `شارع: ${streetName.trim()}`,
      `عمارة: ${buildingNumber.trim()}`,
      floor.trim() ? `دور: ${floor.trim()}` : null,
      `شقة: ${apartment.trim()}`,
      landmark.trim() ? `علامة مميزة: ${landmark.trim()}` : null,
      `تليفون: ${phone.trim()}`,
    ]
      .filter(Boolean)
      .join(' - ');

    const finalLabel = label.trim() || `شارع ${streetName.trim()}`;

    setSubmitting(true);
    const result = await addUserAddress({
      label: finalLabel,
      details: formattedDetails,
      lat: lat!,
      lng: lng!,
      streetName: streetName.trim(),
      buildingNumber: buildingNumber.trim(),
      floor: floor.trim() || undefined,
      apartment: apartment.trim(),
      landmark: landmark.trim() || undefined,
      phone: phone.trim(),
    });
    setSubmitting(false);

    if (result) {
      Alert.alert(
        language === 'ar' ? 'تم حفظ العنوان بنجاح ✅' : 'Address Saved ✅',
        liveDeliveryCalc?.isWithinRadius
          ? language === 'ar'
            ? `تم حفظ عنوانك بنجاح! خدمة التوصيل المحسوبة لموقعك: ${liveDeliveryCalc.deliveryFee} ج.م`
            : `Address saved! Delivery fee: ${liveDeliveryCalc.deliveryFee} EGP`
          : language === 'ar'
          ? 'تمت إضافة العنوان بنجاح'
          : 'Address added successfully.'
      );
      setLabel('المنزل');
      setStreetName('');
      setBuildingNumber('');
      setFloor('');
      setApartment('');
      setLandmark('');
      setLat(null);
      setLng(null);
      setShowAddForm(false);
      await loadAddresses();
    } else {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar'
          ? 'فشل حفظ العنوان، يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً'
          : 'Failed to save address.'
      );
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      language === 'ar' ? 'حذف العنوان' : 'Delete Address',
      language === 'ar' ? 'هل تريد حذف هذا العنوان المحفوظ؟' : 'Delete this saved address?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteUserAddress(id);
            if (ok) {
              loadAddresses();
            }
          },
        },
      ]
    );
  };

  const renderAddressCard = ({ item }: { item: UserAddress }) => {
    const hasInvalidCoords = isInvalidLocation(item.lat, item.lng);
    const addrDelivery =
      !hasInvalidCoords && branches.length > 0
        ? calculateDeliveryForCustomer(item.lat, item.lng, branches)
        : null;

    return (
      <View style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconCircle, hasInvalidCoords && { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.iconText}>{hasInvalidCoords ? '⚠️' : '📍'}</Text>
        </View>

        <View style={styles.addressInfo}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.addressLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {item.label}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteAddress(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.addressDetails, { textAlign: isRTL ? 'right' : 'left' }]}>
            {item.details}
          </Text>

          {(item.streetName || item.buildingNumber || item.apartment || item.landmark || item.phone) ? (
            <View style={styles.structuredBadgesWrap}>
              <Text style={[styles.manualDetailText, { textAlign: isRTL ? 'right' : 'left' }]}>
                🏢{' '}
                {[
                  item.streetName ? `شارع: ${item.streetName}` : null,
                  item.buildingNumber ? `عمارة: ${item.buildingNumber}` : null,
                  item.floor ? `دور: ${item.floor}` : null,
                  item.apartment ? `شقة: ${item.apartment}` : null,
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </Text>
              {item.landmark ? (
                <Text style={[styles.landmarkText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  ⭐ علامة مميزة: {item.landmark}
                </Text>
              ) : null}
              {item.phone ? (
                <Text style={[styles.phoneText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  📞 تليفون التواصل: {item.phone}
                </Text>
              ) : null}
            </View>
          ) : null}

          {addrDelivery ? (
            <View
              style={[
                styles.addrDeliveryPill,
                addrDelivery.isWithinRadius
                  ? { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }
                  : { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: addrDelivery.isWithinRadius ? '#047857' : '#B91C1C',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {addrDelivery.isWithinRadius
                  ? `🚚 خدمة التوصيل: ${addrDelivery.deliveryFee} ج.م (المسافة: ${addrDelivery.distanceKm} كم)`
                  : `⚠️ خارج نطاق التوصيل (${addrDelivery.distanceKm} كم)`}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تسجيل العنوان والموقع (GPS)' : 'Saved Addresses & GPS'}
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(!showAddForm)}>
          <Text style={styles.addButtonText}>{showAddForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressCard}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            showAddForm ? (
              <View style={styles.formCard}>
                <Text style={[styles.formTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  📍 {language === 'ar' ? 'تسجيل عنوان جديد عبر الـ GPS والخريطة' : 'Add New Address via GPS & Map'}
                </Text>

                {/* Step 1: Location & Map Buttons */}
                <View style={styles.gpsSectionBox}>
                  <Text style={[styles.stepLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar'
                      ? '1️⃣ شغل الـ GPS وحدد موقعك على الخريطة لحساب خدمة التوصيل:'
                      : '1️⃣ Turn on GPS & pick your location on the map:'}
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryMapBtn, { backgroundColor: primaryColor }]}
                    onPress={handleFetchGPSAndOpenMap}
                    disabled={locating}
                  >
                    {locating ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryMapBtnText}>
                        🎯🗺️{' '}
                        {lat
                          ? language === 'ar'
                            ? 'تعديل موقعي على الخريطة أو إعادة تشغيل الـ GPS'
                            : 'Update Location on Map / GPS'
                          : language === 'ar'
                          ? 'تشغيل الـ GPS وفتح الخريطة لتحديد موقعي'
                          : 'Turn On GPS & Open Interactive Map'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryMapBtn, { borderColor: primaryColor }]}
                    onPress={() => setShowMapModal(true)}
                  >
                    <Text style={[styles.secondaryMapBtnText, { color: primaryColor }]}>
                      🗺️{' '}
                      {lat
                        ? `${language === 'ar' ? 'الموقع المحدد:' : 'Selected:'} ${lat.toFixed(4)}, ${lng?.toFixed(4)} (اضغط لفتح الخريطة)`
                        : language === 'ar'
                        ? 'فتح الخريطة التفاعلية مباشرة'
                        : 'Open Interactive Map Directly'}
                    </Text>
                  </TouchableOpacity>

                  {/* Live Delivery Calculation Banner */}
                  {liveDeliveryCalc ? (
                    <View
                      style={[
                        styles.liveDeliveryCard,
                        liveDeliveryCalc.isWithinRadius
                          ? styles.liveDeliveryOk
                          : styles.liveDeliveryError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.liveDeliveryTitle,
                          liveDeliveryCalc.isWithinRadius
                            ? { color: '#065F46' }
                            : { color: '#991B1B' },
                        ]}
                      >
                        {liveDeliveryCalc.isWithinRadius
                          ? `✅ تم تحديد الموقع — خدمة التوصيل: ${liveDeliveryCalc.deliveryFee} ج.م`
                          : `⚠️ موقعك خارج نطاق التوصيل المتاح`}
                      </Text>
                      <Text
                        style={[
                          styles.liveDeliverySub,
                          liveDeliveryCalc.isWithinRadius
                            ? { color: '#047857' }
                            : { color: '#B91C1C' },
                        ]}
                      >
                        {liveDeliveryCalc.isWithinRadius
                          ? `المسافة المحسوبة بالـ GPS عن الفرع: ${liveDeliveryCalc.distanceKm} كم`
                          : liveDeliveryCalc.reason}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noGpsHint}>
                      💡 بمجرد تشغيل الـ GPS وتحديد موقعك على الخريطة سيقوم السيستم بحساب خدمة التوصيل تلقائياً
                    </Text>
                  )}

                  {isStaleLocation && (
                    <Text style={styles.staleWarningText}>
                      ⚠️ تأكد من مكان الدبوس على الخريطة لضمان دقة حساب التوصيل
                    </Text>
                  )}
                </View>

                {/* Step 2: Detailed Address Inputs */}
                <Text style={[styles.stepLabel, { textAlign: isRTL ? 'right' : 'left', marginTop: 8 }]}>
                  {language === 'ar'
                    ? '2️⃣ أدخل تفاصيل العنوان ورقم التليفون للتواصل:'
                    : '2️⃣ Enter building, apartment, street, landmark & phone:'}
                </Text>

                {/* Street Name */}
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'اسم الشارع *' : 'Street Name *'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={language === 'ar' ? 'مثال: شارع سكينة / شارع 7' : 'e.g. Street 7'}
                  value={streetName}
                  onChangeText={setStreetName}
                />

                {/* Building Number & Apartment Number */}
                <View style={styles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? 'رقم الشقة *' : 'Apartment No *'}
                    </Text>
                    <TextInput
                      style={[styles.input, styles.halfInput, { textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder={language === 'ar' ? 'مثال: شقة 4' : 'Apt No'}
                      value={apartment}
                      onChangeText={setApartment}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? 'رقم العمارة *' : 'Building No *'}
                    </Text>
                    <TextInput
                      style={[styles.input, styles.halfInput, { textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder={language === 'ar' ? 'مثال: عمارة 12' : 'Bldg No'}
                      value={buildingNumber}
                      onChangeText={setBuildingNumber}
                    />
                  </View>
                </View>

                {/* Floor & Address Label */}
                <View style={styles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? 'اسم العنوان (المنزل/العمل)' : 'Address Label'}
                    </Text>
                    <TextInput
                      style={[styles.input, styles.halfInput, { textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder={language === 'ar' ? 'المنزل / العمل' : 'Home / Work'}
                      value={label}
                      onChangeText={setLabel}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? 'الدور (اختياري)' : 'Floor (Optional)'}
                    </Text>
                    <TextInput
                      style={[styles.input, styles.halfInput, { textAlign: isRTL ? 'right' : 'left' }]}
                      placeholder={language === 'ar' ? 'مثال: الدور 3' : 'Floor'}
                      value={floor}
                      onChangeText={setFloor}
                    />
                  </View>
                </View>

                {/* Landmark (علامة مميزة لو في) */}
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'علامة مميزة (لو في)' : 'Landmark (Optional)'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={
                    language === 'ar'
                      ? 'مثال: بجوار صيدلية... أو أمام مسجد...'
                      : 'e.g. Next to pharmacy / mosque'
                  }
                  value={landmark}
                  onChangeText={setLandmark}
                />

                {/* Contact Phone (رقم تليفون للتواصل) */}
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'رقم تليفون للتواصل *' : 'Contact Phone Number *'}
                </Text>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={language === 'ar' ? 'أدخل رقم الموبايل للتواصل عند التوصيل' : '01xxxxxxxxx'}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: primaryColor }]}
                  onPress={handleSaveAddress}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      💾 {language === 'ar' ? 'حفظ العنوان والموقع' : 'Save Address & Location'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addTopBannerBtn, { backgroundColor: primaryColor }]}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addTopBannerBtnText}>
                  + {language === 'ar' ? 'إضافة عنوان جديد عبر الـ GPS والخريطة' : 'Add New Address via GPS & Map'}
                </Text>
              </TouchableOpacity>
            )
          }
          ListEmptyComponent={
            !showAddForm ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                  {language === 'ar' ? 'لا توجد عناوين محفوظة' : 'No saved addresses'}
                </Text>
                <TouchableOpacity
                  style={[styles.newAddrBtn, { backgroundColor: primaryColor }]}
                  onPress={() => setShowAddForm(true)}
                >
                  <Text style={styles.newAddrBtnText}>
                    + {language === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <LocationPickerMapModal
        visible={showMapModal}
        initialLat={lat}
        initialLng={lng}
        primaryColor={primaryColor}
        onClose={() => setShowMapModal(false)}
        onConfirm={(selectedLat, selectedLng, detectedStreet) => {
          setLat(selectedLat);
          setLng(selectedLng);
          if (detectedStreet && !streetName.trim()) {
            setStreetName(detectedStreet);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 15,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  iconText: {
    fontSize: 20,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  addressDetails: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
  },
  structuredBadgesWrap: {
    marginTop: 6,
    gap: 2,
  },
  manualDetailText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  landmarkText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  phoneText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: 'bold',
  },
  addrDeliveryPill: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  gpsSectionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
    gap: 8,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  primaryMapBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  primaryMapBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  secondaryMapBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  secondaryMapBtnText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  liveDeliveryCard: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  liveDeliveryOk: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  liveDeliveryError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  liveDeliveryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  liveDeliverySub: {
    fontSize: 11.5,
    marginTop: 2,
    textAlign: 'center',
  },
  noGpsHint: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  staleWarningText: {
    fontSize: 11,
    color: '#B45309',
    textAlign: 'center',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    color: '#0F172A',
  },
  halfInput: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  addTopBannerBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addTopBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  newAddrBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  newAddrBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
