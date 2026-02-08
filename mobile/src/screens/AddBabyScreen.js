import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useBaby } from '../context/BabyContext';

export default function AddBabyScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    dailyFeedingGoalOz: '24',
    dailySleepGoalHours: '14',
  });
  const [loading, setLoading] = useState(false);
  const { addBaby } = useBaby();

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);
    const result = await addBaby({
      ...formData,
      dailyFeedingGoalOz: parseFloat(formData.dailyFeedingGoalOz),
      dailySleepGoalHours: parseFloat(formData.dailySleepGoalHours),
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Éxito', 'Bebé agregado exitosamente');
      navigation.goBack();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
          placeholder="Nombre del bebé"
        />

        <Text style={styles.label}>Apellido *</Text>
        <TextInput
          style={styles.input}
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
          placeholder="Apellido del bebé"
        />

        <Text style={styles.label}>Fecha de Nacimiento * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={formData.dateOfBirth}
          onChangeText={(value) => updateField('dateOfBirth', value)}
          placeholder="2024-01-15"
        />

        <Text style={styles.label}>Género</Text>
        <TextInput
          style={styles.input}
          value={formData.gender}
          onChangeText={(value) => updateField('gender', value)}
          placeholder="Masculino/Femenino/Otro"
        />

        <Text style={styles.label}>Meta Diaria de Alimentación (oz)</Text>
        <TextInput
          style={styles.input}
          value={formData.dailyFeedingGoalOz}
          onChangeText={(value) => updateField('dailyFeedingGoalOz', value)}
          keyboardType="decimal-pad"
          placeholder="24"
        />

        <Text style={styles.label}>Meta Diaria de Sueño (horas)</Text>
        <TextInput
          style={styles.input}
          value={formData.dailySleepGoalHours}
          onChangeText={(value) => updateField('dailySleepGoalHours', value)}
          keyboardType="decimal-pad"
          placeholder="14"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
