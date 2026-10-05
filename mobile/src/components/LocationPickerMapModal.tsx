import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Image,
  PanResponder,
  TextInput,
  LayoutChangeEvent,
} from 'react-native';
import { getCurrentLocation } from '@/services/location';
import { calculateDeliveryForCustomer } from '@/services/delivery';
import { useRestaurant } from '@/context/RestaurantContext';

interface LocationPickerMapModalProps {
  visible: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  primaryColor?: string;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, detectedStreet?: string) => void;
}

const TILE_SIZE = 256;
const GRID_RADIUS = 2; // 5x5 tiles = 1280x1280px

function latLngToTileExact(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function tileExactToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lng: Math.round(lng * 1000000) / 1000000,
  };
}

export function LocationPickerMapModal({
  visible,
  initialLat,
  initialLng,
  primaryColor = '#2196F3',
  onClose,
  onConfirm,
}: LocationPickerMapModalProps) {
  const { restaurant } = useRestaurant();
  const branches = (restaurant as any)?.branches || [];

  const defaultLat = initialLat && initialLat !== 0 ? initialLat : 31.2125;
  const defaultLng = initialLng && initialLng !== 0 ? initialLng : 29.9981;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [zoom, setZoom] = useState<number>(16);
  const [locating, setLocating] = useState<boolean>(false);
  const [detectedStreet, setDetectedStreet] = useState<string>('');
  const [reverseLoading, setReverseLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);

  // Native Slippy Map container size & live drag offset
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 420,
  });
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs to keep latest values inside PanResponder callbacks
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  const zoomRef = useRef(zoom);
  latRef.current = lat;
  lngRef.current = lng;
  zoomRef.current = zoom;

  useEffect(() => {
    if (visible) {
      if (initialLat && initialLng && initialLat !== 0 && initialLng !== 0) {
        setLat(initialLat);
        setLng(initialLng);
        reverseGeocodeCoords(initialLat, initialLng);
      } else {
        handleGetGPS();
      }
    }
  }, [visible, initialLat, initialLng]);

  const reverseGeocodeCoords = async (targetLat: number, targetLng: number) => {
    setReverseLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'RivixRestaurantApp/1.0',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const road =
          data?.address?.road ||
          data?.address?.pedestrian ||
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          '';
        const display = road || data?.display_name?.split('،')?.slice(0, 2)?.join('، ') || '';
        if (display) {
          setDetectedStreet(display);
        }
      }
    } catch {
      // Ignore reverse geocoding network issues
    } finally {
      setReverseLoading(false);
    }
  };

  const handleSearchPlace = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&accept-language=ar&limit=1`,
        {
          headers: {
            'User-Agent': 'RivixRestaurantApp/1.0',
          },
        }
      );
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const foundLat = parseFloat(list[0].lat);
          const foundLng = parseFloat(list[0].lon);
          if (!isNaN(foundLat) && !isNaN(foundLng)) {
            setLat(foundLat);
            setLng(foundLng);
            reverseGeocodeCoords(foundLat, foundLng);
          }
        }
      }
    } catch {
      // Ignore search error
    } finally {
      setSearching(false);
    }
  };

  const handleGetGPS = async () => {
    setLocating(true);
    const coords = await getCurrentLocation();
    setLocating(false);
    if (coords) {
      setLat(coords.latitude);
      setLng(coords.longitude);
      reverseGeocodeCoords(coords.latitude, coords.longitude);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderMove: (_, gestureState) => {
          setDragOffset({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy } = gestureState;
          setDragOffset({ x: 0, y: 0 });
          if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

          const exact = latLngToTileExact(latRef.current, lngRef.current, zoomRef.current);
          const newTileX = exact.x - dx / TILE_SIZE;
          const newTileY = exact.y - dy / TILE_SIZE;
          const updated = tileExactToLatLng(newTileX, newTileY, zoomRef.current);
          setLat(updated.lat);
          setLng(updated.lng);
          reverseGeocodeCoords(updated.lat, updated.lng);
        },
        onPanResponderTerminate: () => {
          setDragOffset({ x: 0, y: 0 });
        },
      }),
    []
  );

  // Delivery Fee Live Calculation
  const deliveryInfo = useMemo(() => {
    if (!branches || branches.length === 0) return null;
    return calculateDeliveryForCustomer(lat, lng, branches);
  }, [lat, lng, branches]);

  const handleConfirm = () => {
    onConfirm(lat, lng, detectedStreet || undefined);
    onClose();
  };

  // Compute tile grid for Native Interactive Slippy Map
  const exactTile = latLngToTileExact(lat, lng, zoom);
  const centerTileX = Math.floor(exactTile.x);
  const centerTileY = Math.floor(exactTile.y);
  const subTileOffsetX = (exactTile.x - centerTileX) * TILE_SIZE;
  const subTileOffsetY = (exactTile.y - centerTileY) * TILE_SIZE;

  const gridLeft = mapSize.width / 2 - (GRID_RADIUS * TILE_SIZE + subTileOffsetX) + dragOffset.x;
  const gridTop = mapSize.height / 2 - (GRID_RADIUS * TILE_SIZE + subTileOffsetY) + dragOffset.y;

  const tiles: Array<{ key: string; url: string; left: number; top: number }> = [];
  const maxTileIndex = Math.pow(2, zoom);
  for (let dy = -GRID_RADIUS; dy <= GRID_RADIUS; dy++) {
    for (let dx = -GRID_RADIUS; dx <= GRID_RADIUS; dx++) {
      const tx = ((centerTileX + dx) % maxTileIndex + maxTileIndex) % maxTileIndex;
      const ty = centerTileY + dy;
      if (ty >= 0 && ty < maxTileIndex) {
        tiles.push({
          key: `${zoom}_${tx}_${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
          left: (dx + GRID_RADIUS) * TILE_SIZE,
          top: (dy + GRID_RADIUS) * TILE_SIZE,
        });
      }
    }
  }

  // Generate HTML for Web interactive Leaflet Map
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; }
          .coords-overlay {
            position: absolute; bottom: 10px; left: 10px; right: 10px;
            background: rgba(15, 23, 42, 0.9); color: white; padding: 8px 12px;
            border-radius: 8px; font-family: sans-serif; font-size: 12px;
            text-align: center; z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="coords-overlay">
          📍 اسحب الدبوس أو اضغط على موقعك في الخريطة: <span id="latlng-display">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
        <script>
          var map = L.map('map').setView([${lat}, ${lng}], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

          function updateCoords(newLat, newLng) {
            document.getElementById('latlng-display').innerText = newLat.toFixed(4) + ', ' + newLng.toFixed(4);
            if (window.parent) {
              window.parent.postMessage(JSON.stringify({ lat: newLat, lng: newLng }), '*');
            }
          }

          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            updateCoords(position.lat, position.lng);
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updateCoords(e.latlng.lat, e.latlng.lng);
          });
        </script>
      </body>
    </html>
  `;

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setMapSize({ width, height });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ إغلاق</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🗺️ حدد موقعك على الخريطة</Text>
          <TouchableOpacity
            onPress={handleGetGPS}
            disabled={locating}
            style={[styles.gpsBtn, { backgroundColor: primaryColor }]}
          >
            {locating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.gpsBtnText}>🎯 موقعي GPS</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarRow}>
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: primaryColor }]}
            onPress={handleSearchPlace}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>بحث 🔍</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن اسم الشارع أو المنطقة (مثال: العوايد، السيوف)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchPlace}
            textAlign="right"
          />
        </View>

        {/* Interactive Map Container */}
        <View style={styles.mapContainer} onLayout={onMapLayout}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={leafletHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              onLoad={() => {
                window.addEventListener('message', (msg) => {
                  try {
                    const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                      setLat(data.lat);
                      setLng(data.lng);
                      reverseGeocodeCoords(data.lat, data.lng);
                    }
                  } catch {}
                });
              }}
            />
          ) : (
            <View style={styles.nativeMapViewport} {...panResponder.panHandlers}>
              <View
                style={[
                  styles.tileGridContainer,
                  {
                    left: gridLeft,
                    top: gridTop,
                    width: (GRID_RADIUS * 2 + 1) * TILE_SIZE,
                    height: (GRID_RADIUS * 2 + 1) * TILE_SIZE,
                  },
                ]}
              >
                {tiles.map((t) => (
                  <Image
                    key={t.key}
                    source={{ uri: t.url }}
                    style={{
                      position: 'absolute',
                      left: t.left,
                      top: t.top,
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                    }}
                    resizeMode="cover"
                  />
                ))}
              </View>

              {/* Center Fixed Target Pin */}
              <View pointerEvents="none" style={styles.centerPinOverlay}>
                <View style={[styles.pinBubble, { backgroundColor: primaryColor }]}>
                  <Text style={styles.pinBubbleText}>موقع التوصيل</Text>
                </View>
                <Text style={styles.centerPinEmoji}>📍</Text>
                <View style={styles.pinShadowDot} />
              </View>

              {/* Zoom Controls */}
              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((z) => Math.min(18, z + 1))}
                >
                  <Text style={styles.zoomBtnText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoom((z) => Math.max(11, z - 1))}
                >
                  <Text style={styles.zoomBtnText}>−</Text>
                </TouchableOpacity>
              </View>

              {/* Floating GPS Recenter Button */}
              <TouchableOpacity
                style={styles.floatingMyLocationBtn}
                onPress={handleGetGPS}
                disabled={locating}
              >
                {locating ? (
                  <ActivityIndicator color={primaryColor} size="small" />
                ) : (
                  <Text style={styles.floatingMyLocationText}>🎯 تحديد موقعي بالـ GPS</Text>
                )}
              </TouchableOpacity>

              {/* Drag Instruction Pill */}
              <View pointerEvents="none" style={styles.mapHintPill}>
                <Text style={styles.mapHintText}>
                  🖐️ اسحب الخريطة لوضع الدبوس على موقع العمارة بدقة
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Live Delivery Fee & Detected Street Summary Footer */}
        <View style={styles.footer}>
          {detectedStreet || reverseLoading ? (
            <View style={styles.detectedStreetBox}>
              <Text style={styles.detectedStreetText} numberOfLines={1}>
                📍 {reverseLoading ? 'جاري قراءة اسم الشارع من الخريطة...' : detectedStreet}
              </Text>
            </View>
          ) : null}

          {deliveryInfo ? (
            <View
              style={[
                styles.deliveryCalcBox,
                deliveryInfo.isWithinRadius ? styles.deliveryOkBox : styles.deliveryOutBox,
              ]}
            >
              <Text
                style={[
                  styles.deliveryCalcTitle,
                  deliveryInfo.isWithinRadius ? { color: '#065F46' } : { color: '#991B1B' },
                ]}
              >
                {deliveryInfo.isWithinRadius
                  ? `🚚 خدمة التوصيل المحسوبة: ${deliveryInfo.deliveryFee} ج.م (المسافة: ${deliveryInfo.distanceKm} كم)`
                  : `⚠️ ${deliveryInfo.reason || 'موقعك خارج نطاق التوصيل المتاح'}`}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: primaryColor }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>
              ✅ تأكيد هذا الموقع وحساب التوصيل ({lat.toFixed(4)}, {lng.toFixed(4)})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 58,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: 'bold',
  },
  gpsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  gpsBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  searchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  nativeMapViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
  },
  tileGridContainer: {
    position: 'absolute',
  },
  centerPinOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
  },
  pinBubble: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 2,
    elevation: 4,
  },
  pinBubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  centerPinEmoji: {
    fontSize: 38,
  },
  pinShadowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    marginTop: -4,
  },
  zoomControls: {
    position: 'absolute',
    right: 14,
    top: 16,
    gap: 8,
  },
  zoomBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zoomBtnText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  floatingMyLocationBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  floatingMyLocationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  mapHintPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 68,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  mapHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  detectedStreetBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  detectedStreetText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'right',
  },
  deliveryCalcBox: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  deliveryOkBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  deliveryOutBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  deliveryCalcTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
