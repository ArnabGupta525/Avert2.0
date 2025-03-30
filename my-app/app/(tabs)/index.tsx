import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getColors } from '@/constants/colors';
import { useDisasterStore } from '@/store/disaster-store';
import StatusCard from '@/components/StatusCard';
import { WeatherGrid } from '@/components/WeatherCard';
import LocationCard from '@/components/LocationCard';
import ShelterList from '@/components/ShelterList';
import ChecklistCard from '@/components/ChecklistCard';
import MapPlaceholder from '@/components/MapPlaceholder';
import { useRouter } from 'expo-router';
import { AlertCircle, Users } from 'lucide-react-native';
import TweetCard from '@/components/TweetCard';
import * as Location from 'expo-location';
import axios from 'axios';
import { FLASK_SERVER_URL } from '@/config';

import * as LucideIcons from 'lucide-react-native';

export default function DashboardScreen() {
  const { 
    emergencyStatus, 
    weatherData, 
    userLocation, 
    disasterTweets, 
    isLoading, 
    error,
    fetchDisasterTweets,
    setUserLocation,
    communityReports,
    fetchCommunityReports
  } = useDisasterStore();
  const colors = getColors();
  const router = useRouter();
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard mounting...');
    
    const fetchAllData = async () => {
      try {
        // Fetch disaster tweets
        await fetchDisasterTweets();
        console.log('Tweets fetched successfully');
        
        // Fetch community reports
        await fetchCommunityReports();
        console.log('Community reports fetched successfully');
        
        // Request location permissions and fetch location data
        await fetchLocationData();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();

    // Log the current state
    console.log('Current state:', {
      tweetsCount: disasterTweets.length,
      tweets: disasterTweets,
      communityReportsCount: communityReports.length,
      isLoading,
      error
    });

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      console.log('Refreshing data...');
      fetchAllData();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  // Function to fetch and update location data
  const fetchLocationData = async () => {
    setLocationLoading(true);
    
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }
      
      // Get current location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Fetch location details from API
      await fetchMapConfig(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Function to fetch map configuration and update user location
  const fetchMapConfig = async (latitude: number, longitude: number) => {
    try {
      let url = `${FLASK_SERVER_URL}/map/config`;
      
      // Add location parameters
      url += `?lat=${latitude}&lng=${longitude}`;
      
      const response = await axios.get(url);
      console.log("Location API Response:", response.data);
      
      // Update user location in store with the fetched location name
      if (setUserLocation) {
        console.log("Updating user location with name:", response.data.locationName || 'Unknown Location');
        setUserLocation({
          ...userLocation,
          name: response.data.locationName || 'Unknown Location',
          latitude: latitude,
          longitude: longitude,
        });
        console.log("Updated user location:", userLocation);
      }
    } catch (error) {
      console.error('Failed to fetch map configuration:', error);
      
      // Still update user location even if API fails
      if (setUserLocation) {
        setUserLocation({
          ...userLocation,
          latitude: latitude,
          longitude: longitude,
        });
      }
    }
  };

  // Add this debug function
  const logTweetData = (tweet: any) => {
    console.log('Tweet being rendered:', {
      text: tweet.text,
      author: tweet.author,
      created_at: tweet.created_at,
      confidence: tweet.disaster_confidence
    });
  };

  // Add a function to render the latest community report
  const renderCommunityReportSection = () => {
    // Check if there are any community reports
    if (!communityReports || communityReports.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No community reports at this time
          </Text>
        </View>
      );
    }

    // Get the latest report (first in the array)
    const latestReport = communityReports[0];

    // Get the appropriate icon for the report category
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'flooding':
          return <LucideIcons.Droplets size={20} color="#3498db" />;
        case 'infrastructure':
          return <LucideIcons.Zap size={20} color="#f39c12" />;
        case 'obstruction':
          return <LucideIcons.TrafficCone size={20} color="#e74c3c" />;
        case 'resources':
          return <LucideIcons.ShoppingCart size={20} color="#2ecc71" />;
        default:
          return <LucideIcons.AlertTriangle size={20} color={colors.warning} />;
      }
    };

    // Format the date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      }
    };

    return (
      <>
        <TouchableOpacity 
          style={[styles.reportCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/community-reports')}
          activeOpacity={0.7}
        >
          <View style={styles.reportHeader}>
            <View style={styles.categoryContainer}>
              {getCategoryIcon(latestReport.category)}
              <Text style={[styles.categoryText, { color: colors.text }]}>
                {latestReport.category.charAt(0).toUpperCase() + latestReport.category.slice(1)}
              </Text>
            </View>
            {latestReport.verified ? (
              <View style={styles.verifiedBadge}>
                <LucideIcons.CheckCircle size={14} color={colors.statusVerified} />
                <Text style={[styles.verifiedText, { color: colors.statusVerified }]}>Verified</Text>
              </View>
            ) : (
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatDate(latestReport.reportedAt)}
              </Text>
            )}
          </View>
          
          <Text style={[styles.reportTitle, { color: colors.text }]}>
            {latestReport.title}
          </Text>
          
          <View style={styles.locationContainer}>
          <LucideIcons.MapPin size={14} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {latestReport.location}
            </Text>
          </View>
        </TouchableOpacity>
        
        {communityReports.length > 1 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => router.push('/community-reports')}
          >
            <Text style={[styles.showMoreText, { color: colors.primary }]}>
              View all {communityReports.length} community reports
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  // Update the tweet rendering section
  const renderTweetsSection = () => {
    console.log('Rendering tweets section:', {
      tweetsCount: disasterTweets.length,
      isLoading,
      error
    });

    if (error) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
  {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchDisasterTweets}
          >
            <Text style={[styles.retryText, { color: colors.text }]}>
  Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isLoading && disasterTweets.length === 0) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading disaster alerts...
          </Text>
        </View>
      );
    }

    if (!disasterTweets || disasterTweets.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No disaster alerts at this time
          </Text>
        </View>
      );
    }

    // Get the latest tweet (first in the array)
    const latestTweet = disasterTweets[0];
    logTweetData(latestTweet);

    return (
      <>
        <TweetCard
          key="latest-tweet"
          text={latestTweet.text}
          author={latestTweet.author}
          created_at={latestTweet.created_at}
          disaster_confidence={latestTweet.disaster_confidence}
        />
        {disasterTweets.length > 1 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => router.push('/disaster-alerts')}
          >
            <Text style={[styles.showMoreText, { color: colors.primary }]}>
              View all {disasterTweets.length} disaster alerts
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Status</Text>
          <StatusCard 
            level={emergencyStatus.level}
            message={emergencyStatus.message}
            lastUpdated={emergencyStatus.lastUpdated}
            activeIncidents={emergencyStatus.activeIncidents}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Disaster Alerts
            </Text>
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: `${colors.primary}20` }]}
              onPress={() => router.push('/disaster-alerts')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {renderTweetsSection()}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Official Directives</Text>
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: `${colors.primary}20` }]}
              onPress={() => router.push('/government-directives')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.directiveCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/government-directives')}
            activeOpacity={0.7}
          >
            <View style={styles.directiveCardContent}>
              <AlertCircle size={24} color={colors.statusActive} />
              <View style={styles.directiveCardText}>
                <Text style={[styles.directiveCardTitle, { color: colors.text }]}>
                  Active Government Directives
                </Text>
                <Text style={[styles.directiveCardSubtitle, { color: colors.textSecondary }]}>
                  3 active directives require your attention
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weather Conditions</Text>
          <WeatherGrid weatherData={weatherData} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Area</Text>
          <LocationCard 
            name={userLocation.name}
            riskLevel={userLocation.riskLevel}
            evacuationZone={userLocation.evacuationZone}
          />
          <MapPlaceholder 
            title="Risk Heatmap" 
            subtitle="Tap to view detailed risk assessment"
          />
          <ShelterList shelters={[]} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Reports</Text>
            <TouchableOpacity 
              style={[styles.viewAllButton, { backgroundColor: `${colors.primary}20` }]}
              onPress={() => router.push('/community-reports')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {renderCommunityReportSection()}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preparation</Text>
          <ChecklistCard />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  directiveCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  directiveCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directiveCardText: {
    marginLeft: 12,
    flex: 1,
  },
  directiveCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  directiveCardSubtitle: {
    fontSize: 14,
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
  },
});