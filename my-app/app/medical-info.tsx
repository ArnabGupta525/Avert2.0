import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors } from '@/constants/colors';
import { ChevronLeft, Save, Plus, Minus } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface MedicalInfo {
  name: string;
  bloodType: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyContact: string;
  organDonor: boolean;
  notes: string;
}

const defaultMedicalInfo: MedicalInfo = {
  name: '',
  bloodType: '',
  allergies: [],
  medications: [],
  conditions: [],
  emergencyContact: '',
  organDonor: false,
  notes: '',
};

export default function MedicalInfoScreen() {
  const colors = getColors();
  const router = useRouter();
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>(defaultMedicalInfo);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMedicalInfo();
  }, []);

  const loadMedicalInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem('medical-info');
      if (savedInfo) {
        setMedicalInfo(JSON.parse(savedInfo));
      }
    } catch (error) {
      console.error('Failed to load medical info:', error);
    }
  };

  const saveMedicalInfo = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    setIsSaving(true);
    try {
      await AsyncStorage.setItem('medical-info', JSON.stringify(medicalInfo));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to save medical info:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !medicalInfo.allergies.includes(newAllergy.trim())) {
      setMedicalInfo({
        ...medicalInfo,
        allergies: [...medicalInfo.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const removeAllergy = (index: number) => {
    const updatedAllergies = [...medicalInfo.allergies];
    updatedAllergies.splice(index, 1);
    setMedicalInfo({
      ...medicalInfo,
      allergies: updatedAllergies
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const addMedication = () => {
    if (newMedication.trim() && !medicalInfo.medications.includes(newMedication.trim())) {
      setMedicalInfo({
        ...medicalInfo,
        medications: [...medicalInfo.medications, newMedication.trim()]
      });
      setNewMedication('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const removeMedication = (index: number) => {
    const updatedMedications = [...medicalInfo.medications];
    updatedMedications.splice(index, 1);
    setMedicalInfo({
      ...medicalInfo,
      medications: updatedMedications
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const addCondition = () => {
    if (newCondition.trim() && !medicalInfo.conditions.includes(newCondition.trim())) {
      setMedicalInfo({
        ...medicalInfo,
        conditions: [...medicalInfo.conditions, newCondition.trim()]
      });
      setNewCondition('');
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const removeCondition = (index: number) => {
    const updatedConditions = [...medicalInfo.conditions];
    updatedConditions.splice(index, 1);
    setMedicalInfo({
      ...medicalInfo,
      conditions: updatedConditions
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Medical Information',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={saveMedicalInfo}
              disabled={isSaving}
            >
              <Save size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Details</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={medicalInfo.name}
            onChangeText={(text) => setMedicalInfo({ ...medicalInfo, name: text })}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Blood Type</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={medicalInfo.bloodType}
            onChangeText={(text) => setMedicalInfo({ ...medicalInfo, bloodType: text })}
            placeholder="e.g., A+, O-, AB+"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Allergies</Text>
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {medicalInfo.allergies.map((allergy, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{allergy}</Text>
              <TouchableOpacity onPress={() => removeAllergy(index)}>
                <Minus size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.addItemInput, { color: colors.text, borderColor: colors.border }]}
              value={newAllergy}
              onChangeText={setNewAllergy}
              placeholder="Add allergy"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addAllergy}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Medications</Text>
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {medicalInfo.medications.map((medication, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{medication}</Text>
              <TouchableOpacity onPress={() => removeMedication(index)}>
                <Minus size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.addItemInput, { color: colors.text, borderColor: colors.border }]}
              value={newMedication}
              onChangeText={setNewMedication}
              placeholder="Add medication"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addMedication}
            />
            <TouchableOpacity style={styles.addButton} onPress={addMedication}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Conditions</Text>
        <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {medicalInfo.conditions.map((condition, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{condition}</Text>
              <TouchableOpacity onPress={() => removeCondition(index)}>
                <Minus size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.addItemInput, { color: colors.text, borderColor: colors.border }]}
              value={newCondition}
              onChangeText={setNewCondition}
              placeholder="Add medical condition"
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={addCondition}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCondition}>
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contact</Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Emergency Contact Number</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={medicalInfo.emergencyContact}
            onChangeText={(text) => setMedicalInfo({ ...medicalInfo, emergencyContact: text })}
            placeholder="Enter emergency contact number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={[styles.switchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Organ Donor</Text>
          <Switch
            value={medicalInfo.organDonor}
            onValueChange={(value) => {
              setMedicalInfo({ ...medicalInfo, organDonor: value });
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
        <View style={[styles.textAreaContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            value={medicalInfo.notes}
            onChangeText={(text) => setMedicalInfo({ ...medicalInfo, notes: text })}
            placeholder="Enter any additional medical information here"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={saveMedicalInfo}
        >
          <Text style={styles.saveButtonText}>Save Information</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  listContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listItemText: {
    fontSize: 16,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addItemInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  addButton: {
    marginLeft: 8,
    padding: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  textAreaContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});