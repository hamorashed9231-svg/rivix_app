import React, { useEffect, useState } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import { fetchUserAddresses, addUserAddress, UserAddress } from '@/services/user';
import { getCurrentLocation } from '@/services/location';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { primaryColor } = useRestaurant();
  const { language, isRTL } = useLanguage();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualLatStr, setManualLatStr] = useState<string>('');
  const [manualLngStr, setManualLngStr] = useState<string>('');

  const isInvalid = (l: number | null, lg: number | null) => {
    if (!l || !lg) return true;
    if (l === 0 && lg === 0) return true;
    if (Math.abs(l - 30.0444) < 0.0001 && Math.abs(lg - 31.2357) < 0.0001) return true;
    if (Math.abs(l - 24.7136) < 0.0001 && Math.abs(lg - 46.6753) < 0.0001) return true;
    return false;
  };

  const handleFetchCurrentGPS = async () => {
    setLocating(true);
    const coords = await getCurrentLocation();
    setLocating(false);

    if (coords) {
      setLat(coords.latitude);
      setLng(coords.longitude);
      setManualLatStr(coords.latitude.toString());
      setManualLngStr(coords.longitude.toString());
      Alert.alert(
        language === 'ar' ? 'تم تحديد الموقع' : 'Location Found',
        `${language === 'ar' ? 'الإحداثيات: ' : 'Coords: '} ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      );
    } else {
      setShowManualInput(true);
      Alert.alert(
        language === 'ar' ? 'تنبيه الـ GPS' : 'GPS Warning',
        language === 'ar'
          ? 'لم نتمكن من الوصول للـ GPS. يمكنك إدخال إحداثيات موقعك على الخريطة يدويًا.'
          : 'GPS position unavailable. You can enter manual coordinates below.'
      );
    }
  };

  const handleApplyManualCoords = () => {
    const parsedLat = parseFloat(manualLatStr);
    const parsedLng = parseFloat(manualLngStr);

    if (isNaN(parsedLat) || isNaN(parsedLng) || isInvalid(parsedLat, parsedLng)) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'يرجى إدخال خط عرض وطول صحيحين لموقعك' : 'Please enter valid latitude and longitude.'
      );
      return;
    }

    setLat(parsedLat);
    setLng(parsedLng);
    Alert.alert(
      language === 'ar' ? 'تم الحفظ اليدوي' : 'Coords Set',
      `${language === 'ar' ? 'تم اختيار الإحداثيات: ' : 'Set coords: '} ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`
    );
  };

  const handleSaveAddress = async () => {
    if (!label.trim() || !details.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Validation',
        language === 'ar' ? 'يرجى إدخال اسم العنوان والتفاصيل الكاملة' : 'Please fill in address label and details.'
      );
      return;
    }

    if (isInvalid(lat, lng)) {
      Alert.alert(
        language === 'ar' ? 'مطلوب تحديد الموقع' : 'Location Required',
        language === 'ar'
          ? 'من فضلك حدد موقعك على الخريطة لحساب رسوم التوصيل'
          : 'Please select your exact location on the map to calculate delivery fees.'
      );
      return;
    }

    setSubmitting(true);
    const result = await addUserAddress({
      label,
      details,
      lat: lat!,
      lng: lng!,
    });

    setSubmitting(false);

    if (result) {
      Alert.alert(
        language === 'ar' ? 'تم الحفظ' : 'Saved',
        language === 'ar' ? 'تمت إضافة العنوان بنجاح' : 'Address added successfully.'
      );
      setLabel('');
      setDetails('');
      setLat(null);
      setLng(null);
      setManualLatStr('');
      setManualLngStr('');
      setShowAddForm(false);
      loadAddresses();
    } else {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل حفظ العنوان، حاول مجدداً' : 'Failed to save address.'
      );
    }
  };

  const renderAddressCard = ({ item }: { item: UserAddress }) => {
    const hasInvalidCoords = isInvalid(item.lat, item.lng);
    return (
      <View style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconCircle, hasInvalidCoords && { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.iconText}>{hasInvalidCoords ? '⚠️' : '📍'}</Text>
        </View>
        <View style={styles.addressInfo}>
          <Text style={[styles.addressLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{item.label}</Text>
          <Text style={[styles.addressDetails, { textAlign: isRTL ? 'right' : 'left' }]}>{item.details}</Text>
          <Text style={[styles.addressCoords, { textAlign: isRTL ? 'right' : 'left' }, hasInvalidCoords && { color: '#EF4444', fontWeight: 'bold' }]}>
            {hasInvalidCoords
              ? (language === 'ar' ? '⚠️ يتطلب تحديد الموقع على الخريطة' : '⚠️ Requires map location')
              : `GPS: ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}
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
          ListHeaderComponent={
            showAddForm ? (
              <View style={styles.formCard}>
                <Text style={[styles.formTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
                </Text>

                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={language === 'ar' ? 'اسم العنوان (مثال: المنزل / العمل)' : 'Label (e.g. Home / Office)'}
                  value={label}
                  onChangeText={setLabel}
                />

                <TextInput
                  style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={
                    language === 'ar'
                      ? 'العنوان التفصيلي (الشارع، رقم العمارة، الشقة)...'
                      : 'Detailed address (street, building, apt)...'
                  }
                  multiline
                  numberOfLines={3}
                  value={details}
                  onChangeText={setDetails}
                />

                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={handleFetchCurrentGPS}
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.gpsButtonText}>
                      📍 {lat ? `${language === 'ar' ? 'تم الالتقاط:' : 'Captured:'} ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : (language === 'ar' ? 'التقاط الموقع الحالي عبر الـ GPS' : 'Get Current GPS Location')}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: primaryColor }]}
                  onPress={handleSaveAddress}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {language === 'ar' ? 'حفظ العنوان' : 'Save Address'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
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
    fontSize: 18,
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
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 2,
  },
  addressCoords: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  gpsButton: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
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
