import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { getColors } from '@/constants/colors';
import { Home, AlertTriangle, Phone, Map, Bell } from 'lucide-react-native';
import ThemeToggle from '@/components/ThemeToggle';
import SOSButton from '@/components/SOSButton';
import MedicalInfoButton from '@/components/MedicalInfoButton';


export default function TabLayout() {
  const colors = getColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: [styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }],
        headerTitleStyle: [styles.headerTitle, { color: colors.text }],
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerRight: () => (
            <View style={styles.headerRight}>
              <MedicalInfoButton />
              <ThemeToggle />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "",
          tabBarButton: () => (
            <View style={styles.sosButtonContainer}>
              <SOSButton />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <AlertTriangle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color }) => <Phone size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
  },
  tabBarLabel: {
    fontSize: 12,
  },
  header: {
    shadowColor: 'transparent',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerRight: {
    marginRight: 16,
    flexDirection: 'row',
  },
  sosButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 60,
    top: -15,
  },
});