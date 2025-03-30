import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Alert, Platform } from 'react-native';
import { getColors } from '@/constants/colors';
import { AlertTriangle, X, Phone } from 'lucide-react-native';
import { useDisasterStore } from '@/store/disaster-store';
import * as Haptics from 'expo-haptics';

export default function SOSButton() {
  const colors = getColors();
  const { sosActive, activateSOS, deactivateSOS, emergencyContacts } = useDisasterStore();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [activeModalVisible, setActiveModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Animation for the pulse effect
  const pulseAnim = new Animated.Value(1);
  
  useEffect(() => {
    if (sosActive) {
      // Start pulsing animation when SOS is active
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Show active modal
      setActiveModalVisible(true);
    } else {
      // Reset animation
      pulseAnim.setValue(1);
      Animated.timing(pulseAnim).stop();
      
      // Hide active modal
      setActiveModalVisible(false);
    }
  }, [sosActive]);
  
  // Countdown effect for confirmation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (confirmModalVisible && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleConfirmSOS();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [confirmModalVisible, countdown]);
  
  const handleSOSPress = () => {
    if (Platform.OS !== 'web') {
      // Use stronger haptics
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setConfirmModalVisible(true);
    setCountdown(5);
  };
  
  const handleCancelConfirm = () => {
    setConfirmModalVisible(false);
  };
  
  const handleConfirmSOS = async () => {
    setActiveModalVisible(true); // Update UI immediately
    
    // Trigger stronger haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    // Activate SOS in the store in the background
    activateSOS();
    
    setConfirmModalVisible(false);
  };
  
  const handleCancelSOS = () => {
    deactivateSOS();
    setActiveModalVisible(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  // Get emergency contacts
  const emergencyNumbers = emergencyContacts
    .filter(contact => contact.category === 'emergency')
    .slice(0, 3);
  
  return (
    <>
      <TouchableOpacity
        style={[styles.sosButton, { backgroundColor: colors.sosButton }]}
        onPress={handleSOSPress}
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[
            styles.pulseCircle, 
            { 
              backgroundColor: colors.sosPulse,
              transform: [{ scale: pulseAnim }] 
            }
          ]} 
        />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      
      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={colors.sosButton} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm SOS Alert</Text>
              <TouchableOpacity onPress={handleCancelConfirm}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              This will activate an emergency SOS alert. Emergency services may be contacted.
            </Text>
            
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdownText, { color: colors.text }]}>
                Activating in {countdown} seconds...
              </Text>
              <View style={[styles.progressBar, { backgroundColor: `${colors.sosButton}30` }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.sosButton,
                      width: `${(countdown / 5) * 100}%` 
                    }
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={handleCancelConfirm}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: colors.sosButton }]}
                onPress={handleConfirmSOS}
              >
                <Text style={styles.buttonText}>Activate Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Active SOS Modal */}
      <Modal
        visible={activeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={colors.sosButton} />
              <Text style={[styles.modalTitle, { color: colors.sosButton }]}>SOS ACTIVE</Text>
              <View style={{ width: 24 }} />
            </View>
            
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Your emergency alert is active. Help is on the way.
            </Text>
            
            <View style={styles.emergencyContactsContainer}>
              <Text style={[styles.contactsTitle, { color: colors.text }]}>Emergency Contacts:</Text>
              
              {emergencyNumbers.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <Phone size={16} color={colors.sosButton} />
                  <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}:</Text>
                  <Text style={[styles.contactNumber, { color: colors.primary }]}>{contact.number}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[styles.cancelSOSButton, { backgroundColor: colors.card, borderColor: colors.sosButton }]}
              onPress={handleCancelSOS}
            >
              <Text style={[styles.cancelSOSText, { color: colors.sosButton }]}>Cancel SOS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  pulseCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  countdownContainer: {
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emergencyContactsContainer: {
    marginBottom: 20,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelSOSButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  cancelSOSText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
