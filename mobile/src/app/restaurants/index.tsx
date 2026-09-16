import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/context/RestaurantContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/services/api';
import { RestaurantData } from '@/services/restaurant';

export default function RestaurantDiscoveryScreen() {
  const router = useRouter();
  const { setRestaurant, primaryColor } = useRestaurant();
  const { language, isRTL } = useLanguage();

  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/api/mobile/restaurants/list');
        setRestaurants(response.data.restaurants || []);
      } catch (error) {
        console.error('Error fetching restaurants list:', error);
        // Fallback default sample restaurants if server catalog endpoint is not available
        setRestaurants([
          {
            id: '1',
            name: language === 'ar' ? 'مطعم عم عيسى' : 'Am Eissa Restaurant',
            slug: 'am-eissa',
            logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200',
            primaryColor: '#2196F3',
            secondaryColor: '#0A1A3C',
            description: language === 'ar' ? 'أشهر المشويات والمأكولات الشرقية في القاهرة' : 'Famous Egyptian oriental grills & meals',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [language]);

  const handleSelectRestaurant = (item: RestaurantData) => {
    setRestaurant(item);
    router.replace('/home');
  };

  const renderRestaurantCard = ({ item }: { item: RestaurantData }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectRestaurant(item)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.logo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
          style={styles.cardLogo}
          resizeMode="cover"
        />

        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
          {item.description ? (
            <Text style={[styles.cardDescription, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.selectBtn, { backgroundColor: item.primaryColor || primaryColor }]}
            onPress={() => handleSelectRestaurant(item)}
          >
            <Text style={styles.selectBtnText}>
              {language === 'ar' ? 'تصفح المنيو والاختيار' : 'Browse Menu & Select'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
          {language === 'ar' ? 'استكشاف المطاعم' : 'Discover Restaurants'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id || item.slug}
          renderItem={renderRestaurantCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {language === 'ar' ? 'لا توجد مطاعم متاحة حالياً' : 'No restaurants available'}
              </Text>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardLogo: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  cardInfo: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  selectBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
});
