import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Alert } from 'react-native';
import MapView, {Heatmap, PROVIDER_DEFAULT, UrlTile, Marker } from 'react-native-maps';
import { getColors } from '@/constants/colors';
import { useDisasterStore } from '@/store/disaster-store';
import LocationCard from '@/components/LocationCard';
import axios from 'axios';
import * as Location from 'expo-location';
import { ActivityIndicator } from 'react-native';
import { FLASK_SERVER_URL } from '@/config';

interface MapConfig {
  tileServer: string;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  locationName?: string;
}

interface HeatMapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

interface DisasterTweet {
  disaster_confidence: number;
}

interface CommunityReport {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  verified: boolean;
  upvotes: number;
}

export default function MapScreen() {
  const { 
    userLocation, 
    setUserLocation, 
    disasterTweets, 
    communityReports,
    fetchDisasterTweets,
    fetchCommunityReports 
  } = useDisasterStore();
  const colors = getColors();
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatMapPoint[]>([]);
  
  // Create a memoized initial region based on user location
  const initialRegion = useMemo(() => {
    if (userLocation.latitude && userLocation.longitude) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }
    return {
      latitude: 40.7128, // Default to NYC
      longitude: -74.0060,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }, [userLocation.latitude, userLocation.longitude]);

  // Use the location that was already initialized at app startup
  useEffect(() => {
    const initializeMap = async () => {
      setLoading(true);
      
      try {
        // If we already have location from app startup, use it immediately
        if (userLocation.latitude && userLocation.longitude) {
          console.log("Using pre-initialized location for map");
          await fetchMapConfig(userLocation.latitude, userLocation.longitude);
          return;
        }
        
        // Otherwise, request location permissions and get location
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          // Use fallback configuration if permission denied
          fetchMapConfig();
          return;
        }
        
        try {
          // Get current location with high accuracy but with timeout
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            maximumAge: 10000, // Accept a location that is up to 10 seconds old
            timeout: 5000 // Wait only 5 seconds to avoid long delays
          });
          
          console.log("Got current location:", location.coords);
          
          // Immediately update user location with coordinates
          if (setUserLocation) {
            setUserLocation({
              ...userLocation,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
          
          // Fetch map config with user's location
          fetchMapConfig(location.coords.latitude, location.coords.longitude);
        } catch (error) {
          console.error('Error getting location:', error);
          setErrorMsg('Failed to get location');
          fetchMapConfig();
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
      }
    };

    initializeMap();
    
    // Prefetch data in parallel
    fetchDisasterTweets();
    fetchCommunityReports();
  }, []);

  // Generate heatmap when data changes
  useEffect(() => {
    if (mapConfig && (disasterTweets.length > 0 || communityReports.length > 0)) {
      generateHeatmapFromData();
    }
  }, [disasterTweets, communityReports, mapConfig]);

  // Memoize the fetchMapConfig function to prevent unnecessary re-renders
  const fetchMapConfig = useCallback(async (latitude?: number, longitude?: number) => {
    try {
      // If we already have a map config and the same coordinates, don't fetch again
      if (mapConfig && 
          mapConfig.initialRegion.latitude === latitude && 
          mapConfig.initialRegion.longitude === longitude) {
        setLoading(false);
        return;
      }
      
      let url = `${FLASK_SERVER_URL}/map/config`;
      
      // Add location parameters if available
      if (latitude !== undefined && longitude !== undefined) {
        url += `?lat=${latitude}&lng=${longitude}`;
      }
      
      const response = await axios.get(url, { 
        timeout: 5000 // Add timeout to prevent long waits
      });
      
      setMapConfig(response.data);
      
      // Update user location in store with the fetched location name
      if (setUserLocation && latitude !== undefined && longitude !== undefined) {
        setUserLocation({
          ...userLocation,
          name: response.data.locationName || 'Unknown Location',
          latitude: latitude,
          longitude: longitude,
        });
      }
    } catch (error) {
      console.error('Failed to fetch map configuration:', error);
      // Fallback configuration
      setMapConfig({
        tileServer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        initialRegion: {
          latitude: latitude || initialRegion.latitude,
          longitude: longitude || initialRegion.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }
      });
      
      // Still update user location even if API fails
      if (setUserLocation && latitude !== undefined && longitude !== undefined) {
        setUserLocation({
          ...userLocation,
          latitude: latitude,
          longitude: longitude,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [mapConfig, initialRegion, setUserLocation, userLocation]);

  // Memoize the generateHeatmapFromData function
  const generateHeatmapFromData = useCallback(() => {
    if (!mapConfig) return;

    const points: HeatMapPoint[] = [];
    
    // Process disaster tweets
    disasterTweets.forEach(tweet => {
      // Check if the tweet has location data
      // For now, we'll use a random offset from the center for demonstration
      // In a real implementation, you'd extract location data from the tweet
      const { latitude, longitude } = mapConfig.initialRegion;
      const latOffset = (Math.random() - 0.5) * mapConfig.initialRegion.latitudeDelta;
      const lngOffset = (Math.random() - 0.5) * mapConfig.initialRegion.longitudeDelta;
      
      points.push({
        latitude: latitude + latOffset,
        longitude: longitude + lngOffset,
        // Use the disaster confidence as weight (0-100)
        weight: tweet.disaster_confidence * 100
      });
    });
    
    // Process community reports
    communityReports.forEach(report => {
      // Community reports should have coordinates
      if (report.coordinates && report.coordinates.latitude && report.coordinates.longitude) {
        // Calculate weight based on upvotes and verification status
        let weight = 50; // Base weight
        
        // Increase weight for verified reports
        if (report.verified) {
          weight += 25;
        }
        
        // Increase weight based on upvotes (max +25)
        weight += Math.min(25, report.upvotes * 5);
        
        points.push({
          latitude: report.coordinates.latitude,
          longitude: report.coordinates.longitude,
          weight: weight
        });
      }
    });
    
    // Only show a message if no real data is available
    if (points.length === 0) {
      console.log("No disaster data available for heatmap");
    }
    
    setHeatmapData(points);
  }, [mapConfig, disasterTweets, communityReports]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Getting your location...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
        </View>
      )}
      
      <View style={styles.mapContainer}>
        {mapConfig && (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={mapConfig.initialRegion}
            maxZoomLevel={19}
            minZoomLevel={10}
            rotateEnabled={false}
          >
            <UrlTile
              urlTemplate={mapConfig.tileServer}
              maximumZ={19}
              flipY={false}
              zIndex={-1}
            />
            
            {/* Heat Map Layer */}
            {heatmapData.length > 0 && (
              <Heatmap
                points={heatmapData}
                radius={20}
                opacity={0.7}
                gradient={{
                  colors: [
                    colors.statusSafe,      // Low risk (green)
                    colors.statusWarning,   // Moderate risk (yellow/orange)
                    colors.statusDanger,    // High risk (red)
                    '#7D0000'               // Extreme risk (dark red)
                  ],
                  startPoints: [0, 0.33, 0.66, 1],
                }}
              />
            )}
            
            {/* Add a marker for the user's location */}
            {userLocation.latitude && userLocation.longitude && (
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                }}
                title="Your Location"
                description="Your current location"
              />
            )}
          </MapView>
        )}
        
        <View style={[styles.legendContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.legendTitle, { color: colors.text }]}>Risk Level</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.statusSafe }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Low (0-25)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.statusWarning }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Moderate (26-50)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.statusDanger }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>High (51-75)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#7D0000' }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>Extreme (76-100)</Text>
            </View>
          </View>
        </View>
      </View>
      
      {userLocation.latitude && userLocation.longitude && (
        <View style={styles.infoContainer}>
          <LocationCard 
            name={userLocation.name || "Current Location"}
            riskLevel={heatmapData.length > 0 ? "Based on real-time data" : "No data available"}
            evacuationZone={userLocation.evacuationZone || "Unknown"}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  legendContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {},
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  infoContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});