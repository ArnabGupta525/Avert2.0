import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, orderBy, limit, getDocs, Timestamp, where, addDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  emergencyStatus,
  weatherData,
  userLocation,
  emergencyContacts,
  checklistItems,
  governmentDirectives,
  communityReports
} from '@/constants/mock-data';
import { calculateDistance } from '@/utils/location';
import * as Location from 'expo-location';

interface UserLocation {
  name: string;
  riskLevel: string;
  evacuationZone: string;
  latitude?: number;
  longitude?: number;
}

interface Tweet {
  text: string;
  author: string;
  created_at: string;
  disaster_confidence: number;
}

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  distance?: number; // Will be calculated based on user's location
}

interface DisasterState {
  emergencyStatus: {
    level: 'safe' | 'warning' | 'danger' | 'unknown';
    message: string;
    lastUpdated: string;
    activeIncidents: number;
  };
  weatherData: {
    temperature: number;
    pressure: number;
    humidity: number;
    wind: {
      speed: number;
      direction: string;
    };
    visibility: number;
    precipitation: number;
    forecast: Array<{
      day: string;
      high: number;
      low: number;
      condition: string;
    }>;
  };
  userLocation: UserLocation;
  emergencyContacts: EmergencyContact[];
  checklistItems: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
  }>;
  governmentDirectives: Array<{
    id: string;
    title: string;
    description: string;
    authority: string;
    status: 'active' | 'expired' | 'scheduled';
    issuedAt: string;
    expiresAt: string | null;
  }>;
  communityReports: Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    reportedBy: string;
    reportedAt: string;
    upvotes: number;
    verified: boolean;
    category: string;
    images: string[];
  }>;

  disasterTweets: Tweet[];
  isLoading: boolean;
  error: string | null;

  sosActive: boolean;
  sosStartTime: string | null;

  // Actions
  toggleChecklistItem: (id: string) => void;
  addEmergencyContact: (contact: { name: string; number: string; category: string }) => void;
  removeEmergencyContact: (id: string) => void;
  updateUserLocation: (location: { name: string; coordinates: { latitude: number; longitude: number } }) => void;
  upvoteReport: (id: string) => void;
  addCommunityReport: (report: Omit<DisasterState['communityReports'][0], 'id' | 'upvotes' | 'verified' | 'reportedAt'>) => Promise<string>;
  fetchCommunityReports: () => Promise<Array<{
    id: string;
    title: string;
    description: string;
    location: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    reportedBy: string;
    reportedAt: string;
    upvotes: number;
    verified: boolean;
    category: string;
    images: string[];
  }>>;
  activateSOS: () => void;
  deactivateSOS: () => void;
  setUserLocation: (location: UserLocation) => void;
  fetchDisasterTweets: () => Promise<void>;
  fetchNearbyContacts: (latitude: number, longitude: number, radius?: number) => Promise<void>;
}

export const useDisasterStore = create<DisasterState>()(
  persist(
    (set, get) => ({
      emergencyStatus,
      weatherData,
      userLocation: {
        name: 'New York City',
        riskLevel: 'Moderate',
        evacuationZone: 'Zone 3',
        latitude: undefined,
        longitude: undefined,
      },
      emergencyContacts,
      checklistItems,
      governmentDirectives,
      communityReports,
      sosActive: false,
      sosStartTime: null,
      disasterTweets: [],
      isLoading: false,
      error: null,

      fetchDisasterTweets: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('Starting tweet fetch...');
          const tweetsRef = collection(db, 'tweets');

          // Create a query for tweets from the last 24 hours
          const twentyFourHoursAgo = new Date();
          twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

          const q = query(
            tweetsRef,
            orderBy('created_at', 'desc'),
            limit(50)
          );

          console.log('Executing Firestore query...');
          const querySnapshot = await getDocs(q);
          console.log(`Found ${querySnapshot.size} documents`);

          const tweets: Tweet[] = [];

          querySnapshot.forEach(doc => {
            try {
              const data = doc.data();
              console.log('Document data:', data);

              // Handle the timestamp conversion
              let tweetDate: Date;
              if (data.created_at instanceof Timestamp) {
                tweetDate = data.created_at.toDate();
              } else if (typeof data.created_at === 'string') {
                tweetDate = new Date(data.created_at);
              } else {
                tweetDate = new Date();
              }

              const tweet: Tweet = {
                text: data.text || 'No content available',
                author: data.author || 'Anonymous',
                created_at: tweetDate.toISOString(),
                disaster_confidence: parseFloat(data.disaster_confidence) || 0.5
              };

              console.log('Processed tweet:', tweet);
              tweets.push(tweet);
            } catch (e) {
              console.error('Error processing tweet document:', e);
            }
          });

          // If no tweets found in Firestore, use mock data
          if (tweets.length === 0) {
            console.log('No tweets found in Firestore, using mock data');
            const mockTweets: Tweet[] = [
              {
                text: "MOCK: Severe thunderstorm warning for downtown area. Seek shelter immediately.",
                author: "WeatherAlert",
                created_at: new Date().toISOString(),
                disaster_confidence: 0.95
              },
              {
                text: "MOCK: Flash flood warning issued for coastal regions. Avoid low-lying areas.",
                author: "EmergencyServices",
                created_at: new Date(Date.now() - 1800000).toISOString(),
                disaster_confidence: 0.85
              },
              {
                text: "MOCK: High winds reported in northern districts. Secure loose objects.",
                author: "CityAlert",
                created_at: new Date(Date.now() - 3600000).toISOString(),
                disaster_confidence: 0.75
              }
            ];
            tweets.push(...mockTweets);
          }

          // Sort tweets by date
          const sortedTweets = tweets.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          console.log('Final processed tweets:', sortedTweets);

          // Update state with the tweets
          set((state) => {
            console.log('Updating state with tweets:', sortedTweets);
            return {
              disasterTweets: sortedTweets,
              isLoading: false,
              error: null,
              emergencyStatus: {
                ...state.emergencyStatus,
                level: sortedTweets.some(tweet => tweet.disaster_confidence > 0.8) ? 'danger' : 'warning',
                message: `${sortedTweets.length} disaster alerts`,
                activeIncidents: sortedTweets.length,
                lastUpdated: new Date().toISOString()
              }
            };
          });

        } catch (error) {
          console.error('Error fetching tweets:', error);
          // Use mock data on error
          const mockTweets: Tweet[] = [
            {
              text: "ERROR MOCK: Emergency system recovering - Standby for updates",
              author: "SystemAlert",
              created_at: new Date().toISOString(),
              disaster_confidence: 0.9
            }
          ];

          set({
            error: 'Failed to fetch live disaster tweets - Using backup data',
            isLoading: false,
            disasterTweets: mockTweets
          });
        }
      },

      toggleChecklistItem: (id: string) =>
        set((state) => ({
          checklistItems: state.checklistItems.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
          )
        })),

      addEmergencyContact: (contact) =>
        set((state) => ({
          emergencyContacts: [
            ...state.emergencyContacts,
            {
              id: Date.now().toString(),
              ...contact,
              location: {
                latitude: 0,
                longitude: 0,
                address: ''
              }
            }
          ]
        })),

      removeEmergencyContact: (id: string) =>
        set((state) => ({
          emergencyContacts: state.emergencyContacts.filter(contact => contact.id !== id)
        })),

      updateUserLocation: (location) =>
        set((state) => ({
          userLocation: {
            ...state.userLocation,
            ...location,
          }
        })),

      upvoteReport: (id: string) =>
        set((state) => ({
          communityReports: state.communityReports.map(report =>
            report.id === id ? { ...report, upvotes: report.upvotes + 1 } : report
          )
        })),

      addCommunityReport: async (report) => {
        try {
          // Create a reference to the community_reports collection
          const reportsRef = collection(db, 'community_reports');

          // Prepare the report data with timestamp
          const reportData = {
            ...report,
            reportedAt: new Date().toISOString(),
            upvotes: 0,
            verified: false,
            createdAt: Timestamp.now()
          };

          // Add the document to Firestore
          const docRef = await addDoc(reportsRef, reportData);
          console.log("Community report added with ID:", docRef.id);

          // Update the local state
          set((state) => ({
            communityReports: [
              {
                id: docRef.id,
                ...reportData,
              },
              ...state.communityReports,
            ]
          }));

          return docRef.id;
        } catch (error) {
          console.error("Error adding community report:", error);
          throw error;
        }
      },

      fetchCommunityReports: async () => {
        try {
          set(state => ({ isLoading: true, error: null }));

          // Create a reference to the community_reports collection
          const reportsRef = collection(db, 'community_reports');

          // Create a query to get the reports sorted by creation time (newest first)
          const q = query(
            reportsRef,
            orderBy('createdAt', 'desc'),
            limit(50) // Limit to the 50 most recent reports
          );

          // Execute the query
          const querySnapshot = await getDocs(q);

          // Map the documents to our report format
          const reports = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              description: data.description,
              location: data.location,
              coordinates: data.coordinates,
              reportedBy: data.reportedBy,
              reportedAt: data.reportedAt,
              upvotes: data.upvotes,
              verified: data.verified,
              category: data.category,
              images: data.images || [],
            };
          });

          // Update the state with the fetched reports
          set(state => ({
            communityReports: reports,
            isLoading: false
          }));

          console.log(`Fetched ${reports.length} community reports`);
          return reports;
        } catch (error) {
          console.error("Error fetching community reports:", error);
          set(state => ({
            error: "Failed to fetch community reports. Please try again.",
            isLoading: false
          }));
          throw error;
        }
      },

      // Update the activateSOS function in the disaster-store.ts file
      activateSOS: async () => {
        try {
          // Get location
          let location = null;
          const { status } = await Location.requestForegroundPermissionsAsync();

          if (status === 'granted') {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Highest,
              maximumAge: 10000,
              timeout: 10000,
            });
            location = {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            };
          }

          // Get medical info
          let medicalInfo = null;
          try {
            const savedInfo = await AsyncStorage.getItem('medical-info');
            if (savedInfo) {
              medicalInfo = JSON.parse(savedInfo);
            }
          } catch (error) {
            console.error('Failed to load medical info:', error);
          }

          // Send to Firebase and update state in parallel
          const firebasePromise = addDoc(collection(db, 'sos-alerts'), {
            timestamp: new Date(),
            location,
            medicalInfo,
            active: true,
          });
          set({
            sosActive: true,
            sosStartTime: new Date().toISOString()
          });
          await firebasePromise;
        } catch (error) {
          console.error('Error activating SOS:', error);
          // Still activate SOS locally even if Firebase fails
          set({
            sosActive: true,
            sosStartTime: new Date().toISOString()
          });
        }
      },

      deactivateSOS: () =>
        set({
          sosActive: false,
          sosStartTime: null
        }),

      setUserLocation: (location) => set((state) => ({
        userLocation: {
          ...state.userLocation,
          ...location,
        },
      })),

      fetchNearbyContacts: async (latitude: number, longitude: number, radius = 50) => {
        try {
          console.log('Starting to fetch contacts...');
          const contactsRef = collection(db, 'emergency_contacts');
          console.log('Collection reference created');

          try {
            const querySnapshot = await getDocs(contactsRef);
            console.log('Query executed, documents found:', querySnapshot.size);

            // Get all contacts and calculate distances
            const contacts = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const distance = calculateDistance(
                latitude,
                longitude,
                data.location.latitude,
                data.location.longitude
              );

              return {
                id: doc.id,
                ...data,
                distance
              };
            });

            // Filter contacts within radius and sort by distance
            const nearbyContacts = contacts
              .filter(contact => contact.distance <= radius)
              .sort((a, b) => a.distance - b.distance);

            // If no nearby contacts found, fall back to mock data but with distances
            if (nearbyContacts.length === 0) {
              const mockContactsWithDistance = emergencyContacts.map(contact => ({
                ...contact,
                distance: calculateDistance(
                  latitude,
                  longitude,
                  contact.location.latitude,
                  contact.location.longitude
                )
              })).sort((a, b) => a.distance - b.distance);

              set({ emergencyContacts: mockContactsWithDistance });
            } else {
              set({ emergencyContacts: nearbyContacts });
            }
          } catch (queryError) {
            console.error('Error executing query:', queryError);
            throw queryError;
          }
        } catch (error) {
          console.error('Detailed error:', error);
          if (error.code) {
            console.error('Error code:', error.code);
          }
          // Fall back to mock data with distances
          const mockContactsWithDistance = emergencyContacts.map(contact => ({
            ...contact,
            distance: calculateDistance(
              latitude,
              longitude,
              contact.location.latitude,
              contact.location.longitude
            )
          })).sort((a, b) => a.distance - b.distance);

          set({ emergencyContacts: mockContactsWithDistance });
        }
      },
    }),
    {
      name: 'disaster-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        disasterTweets: state.disasterTweets,
        emergencyStatus: state.emergencyStatus
      })
    }
  )
);