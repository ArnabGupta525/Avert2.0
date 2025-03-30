import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, StatusBar, useColorScheme } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { getColors } from "@/constants/colors";
import { useThemeStore } from "@/store/theme-store";
import { useDisasterStore } from "@/store/disaster-store";
import * as Location from "expo-location";
import axios from 'axios';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  
  const systemColorScheme = useColorScheme();
  const { mode, setMode } = useThemeStore();
  const { setUserLocation, fetchDisasterTweets, fetchCommunityReports } = useDisasterStore();
  const colors = getColors();

  // Initialize theme based on system preference
  useEffect(() => {
    if (mode === 'system') {
      setMode('system');
    }
  }, [systemColorScheme]);

  // Initialize location as early as possible
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Request permissions early
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        
        // Get location with high accuracy but short timeout to avoid blocking
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 10000, // Accept a location that is up to 10 seconds old
          timeout: 3000 // Wait only 3 seconds to avoid long delays
        });
        
        // Update location coordinates in store immediately
        if (setUserLocation) {
          setUserLocation({
            name: 'Current Location', // Temporary name until we get the real one
            riskLevel: 'Unknown',
            evacuationZone: 'Unknown',
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
        
        // Get the actual location name using reverse geocoding
        try {
          // Use Expo's built-in reverse geocoding to get location details
          const geoCodeResults = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (geoCodeResults && geoCodeResults.length > 0) {
            const address = geoCodeResults[0];
            // Create a readable location name from the address components
            let locationName = '';
            
            if (address.name) {
              locationName += address.name;
            }
            
            if (address.street) {
              if (locationName) locationName += ', ';
              locationName += address.street;
            }
            
            if (address.district) {
              if (locationName) locationName += ', ';
              locationName += address.district;
            } else if (address.city) {
              if (locationName) locationName += ', ';
              locationName += address.city;
            }
            
            // If we couldn't build a good name from specific components, use the city or region
            if (!locationName && (address.city || address.region)) {
              locationName = address.city || address.region;
            }
            
            // Update user location with the actual location name
            if (locationName && setUserLocation) {
              console.log('Setting location name from geocoding:', locationName);
              setUserLocation({
                name: locationName,
                riskLevel: 'Unknown',
                evacuationZone: 'Unknown',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        } catch (geoError) {
          console.error('Error getting location name from geocoding:', geoError);
          
          // Fallback to the API if geocoding fails
          try {
            const { FLASK_SERVER_URL } = require('@/config');
            const url = `${FLASK_SERVER_URL}/map/config?lat=${location.coords.latitude}&lng=${location.coords.longitude}`;
            const response = await axios.get(url, { timeout: 3000 });
            
            if (response.data && response.data.locationName) {
              // Update with the actual location name from API
              setUserLocation({
                name: response.data.locationName,
                riskLevel: 'Unknown',
                evacuationZone: 'Unknown',
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          } catch (apiError) {
            console.log('Could not fetch location name from API:', apiError);
          }
        }
        
        // Start fetching data in the background
        fetchDisasterTweets();
        fetchCommunityReports();
        
        console.log('Location initialized at app startup:', location.coords);
      } catch (error) {
        console.error('Error initializing location at startup:', error);
      }
    };
    
    initializeLocation();
  }, []);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar 
        barStyle={mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark') ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colors = getColors();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen 
        name="government-directives" 
        options={{ 
          title: "Government Directives",
          presentation: "card"
        }} 
      />
      <Stack.Screen 
        name="community-reports" 
        options={{ 
          title: "Community Reports",
          presentation: "card"
        }} 
      />
    </Stack>
  );
}