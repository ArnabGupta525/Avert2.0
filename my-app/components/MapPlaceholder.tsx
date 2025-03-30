import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getColors } from '@/constants/colors';
import { MapPin } from 'lucide-react-native';
import MapView, { PROVIDER_DEFAULT, UrlTile, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useDisasterStore } from '@/store/disaster-store';
import { useRouter } from 'expo-router';

interface MapPlaceholderProps {
  title: string;
  subtitle?: string;
  height?: number;
  showPin?: boolean;
}

export default function MapPlaceholder({ 
  title, 
  subtitle, 
  height = 180, 
  showPin = true 
}: MapPlaceholderProps) {
  const colors = getColors();
  const { userLocation } = useDisasterStore();
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: userLocation.latitude || 40.7128,
    longitude: userLocation.longitude || -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const router = useRouter();

  useEffect(() => {
    // If we already have user location in the store, use it
    if (userLocation.latitude && userLocation.longitude) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
      return;
    }

    // Otherwise try to get the current location
    const getLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          // Use default location if permission denied
          setLoading(false);
          return;
        }
        
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, [userLocation]);
  
  const handleMapPress = () => {
    router.push('/map');
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]} 
      onPress={handleMapPress}
      activeOpacity={0.8}
    >
      <View style={[styles.mapContent, { height }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            
            {showPin && (
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
              >
                <MapPin size={24} color={colors.danger} />
              </Marker>
            )}
          </MapView>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mapContent: {
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});