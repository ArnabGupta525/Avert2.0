import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getColors } from '@/constants/colors';
import { Heart } from 'lucide-react-native';
import { router } from 'expo-router';

export default function MedicalInfoButton() {
  const colors = getColors();

  const handlePress = () => {
    router.push('/medical-info');
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Heart size={20} color={colors.error} />
      <Text style={[styles.text, { color: colors.text }]}>Medical</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});