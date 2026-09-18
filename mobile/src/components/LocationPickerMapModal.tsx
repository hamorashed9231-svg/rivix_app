import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { getCurrentLocation } from '@/services/location';

interface LocationPickerMapModalProps {
  visible: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  primaryColor?: string;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
}

export function LocationPickerMapModal({
  visible,
  initialLat,
  initialLng,
  primaryColor = '#2196F3',
  onClose,
  onConfirm,
}: LocationPickerMapModalProps) {
  const defaultLat = initialLat && initialLat !== 0 ? initialLat : 31.240346; // Default to El Seyof / Alexandria
  const defaultLng = initialLng && initialLng !== 0 ? initialLng : 29.993331;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [locating, setLocating] = useState<boolean>(false);

  const handleGetGPS = async () => {
    setLocating(true);
    const coords = await getCurrentLocation();
    setLocating(false);
    if (coords) {
      setLat(coords.latitude);
      setLng(coords.longitude);
    }
  };

  const handleConfirm = () => {
    onConfirm(lat, lng);
    onClose();
  };

  // Generate HTML for interactive Leaflet Map with draggable marker & click-to-place pin
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
          📍 اختر موقعك: <span id="latlng-display">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>
        <script>
          var map = L.map('map').setView([${lat}, ${lng}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          var marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

          function updateCoords(newLat, newLng) {
            document.getElementById('latlng-display').innerText = newLat.toFixed(4) + ', ' + newLng.toFixed(4);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ lat: newLat, lng: newLng }));
            }
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

          window.addEventListener('message', function(event) {
            try {
              var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data && data.centerLat) {
                map.setView([data.centerLat, data.centerLng], 14);
                marker.setLatLng([data.centerLat, data.centerLng]);
                updateCoords(data.centerLat, data.centerLng);
              }
            } catch(e){}
          });
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕ إلغاء</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تحديد موقعك على الخريطة</Text>
          <TouchableOpacity onPress={handleGetGPS} disabled={locating} style={styles.gpsBtn}>
            {locating ? <ActivityIndicator color="#0F172A" size="small" /> : <Text style={styles.gpsBtnText}>🎯 موقعي</Text>}
          </TouchableOpacity>
        </View>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={leafletHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              onLoad={(e) => {
                window.addEventListener('message', (msg) => {
                  try {
                    const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
                    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
                      setLat(data.lat);
                      setLng(data.lng);
                    }
                  } catch (err) {}
                });
              }}
            />
          ) : (
            <View style={styles.fallbackMapBox}>
              <Text style={styles.fallbackTitle}>📍 اسحب وحدد موقعك الجغرافي</Text>
              <Text style={styles.fallbackCoords}>
                الإحداثيات الحالية: {lat.toFixed(4)}, {lng.toFixed(4)}
              </Text>
              <View style={styles.quickLocationRow}>
                <TouchableOpacity
                  style={styles.quickLocChip}
                  onPress={() => { setLat(31.240346); setLng(29.993331); }}
                >
                  <Text style={styles.quickLocText}>📍 الإسكندرية - السيوف</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickLocChip}
                  onPress={() => { setLat(31.2001); setLng(29.9187); }}
                >
                  <Text style={styles.quickLocText}>📍 الإسكندرية - محطة الرمل</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Footer Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: primaryColor }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>
              تأكيد الموقع المحدد ({lat.toFixed(4)}, {lng.toFixed(4)}) 📍
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
    height: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  gpsBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsBtnText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  fallbackMapBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  fallbackCoords: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickLocationRow: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  quickLocChip: {
    backgroundColor: '#F1F5F9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickLocText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
