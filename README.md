# Avert 2.0

Avert 2.0 is a comprehensive Real-time disaster aggregation and emergency response mobile application designed to help users stay informed, prepared, and safe during natural disasters and emergency situations. The app provides real-time disaster information, location-based risk assessment, emergency SOS functionality, and community-driven reporting to create a robust platform for disaster preparedness and response.

## Key Features

### Real-Time Disaster Monitoring
- **Live Disaster Data**: Integrates with disaster monitoring APIs to provide up-to-date information about ongoing disasters
- **Dynamic Heatmap**: Visualizes disaster intensity across geographical areas using data from verified disaster tweets and community reports
- **Risk Assessment**: Provides location-based risk levels and evacuation zone information

### Emergency Response
- **SOS Button**: One-tap emergency alert system with countdown confirmation
- **Emergency Contacts**: Quick access to emergency services and personal emergency contacts
- **Location Sharing**: Automatically shares your location when activating SOS

### Interactive Map
- **Real-Time Updates**: Shows disaster-affected areas with heatmap visualization
- **Location Tracking**: Provides accurate location information with reverse geocoding for precise location names
- **Community Reports**: Displays verified reports from other users in your area

### Community Reporting
- **User Reports**: Submit and view reports about local conditions
- **Verification System**: Community verification through upvotes to ensure accuracy
- **Categorized Reporting**: Report various issues including flooding, infrastructure damage, obstructions, and resource availability

### User Dashboard
- **Current Status**: At-a-glance view of your location's risk level and emergency status
- **Weather Information**: Current weather conditions and forecasts
- **Latest Updates**: Recent disaster tweets and community reports in your area
- **Preparation Checklists**: Essential items and steps to prepare for emergencies

### Technical Features
- **React Native & Expo**: Cross-platform mobile application built with React Native and Expo
- **Firebase Integration**: Real-time database for disaster data, user reports, and emergency contacts
- **Location Services**: High-accuracy location tracking with Expo Location
- **Offline Capability**: Core functionality available even with limited connectivity
- **Dark/Light Mode**: Fully customizable UI with theme support
- **Push Notifications**: Alert system for emergency situations and important updates

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/avert-2.0.git

# Navigate to the project directory
cd avert-2.0

# Install dependencies
npm install

# Start the development server
npx expo start
```

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```
FLASK_SERVER_URL=your_backend_url
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id
```

2. Configure your Firebase project with the necessary collections:
   - disasterTweets
   - communityReports
   - emergencyContacts
   - userProfiles

## Usage

### Dashboard
The dashboard provides an overview of your current situation, including:
- Current location and risk level
- Weather conditions
- Latest disaster tweets and community reports
- Quick access to emergency features

### Map
The interactive map shows:
- Your current location
- Disaster heatmap based on real data
- Community reports in your area
- Evacuation routes (when available)

### SOS
The SOS feature allows you to:
- Send emergency alerts to configured contacts
- Share your precise location
- Access emergency services contact information

### Alerts
Stay informed with:
- Official emergency alerts
- Weather warnings
- Community notifications

### Contacts
Manage your emergency contacts:
- Add personal emergency contacts
- Access local emergency services
- Configure automatic messages for SOS activation

## Screenshots

![Dashboard](https://via.placeholder.com/250x500)
![Map View](https://via.placeholder.com/250x500)
![SOS Feature](https://via.placeholder.com/250x500)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Expo** for the development framework
- **Firebase** for backend services
- **React Native Maps** for map functionality
- **Lucide Icons** for the beautiful icon set

## Contact

Project Link: [https://github.com/ArnabGupta525/avert-2.0](https://github.com/ArnabGupta525/avert-2.0 
