import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useBaby } from '../context/BabyContext';
import api from '../config/api';
import { format } from 'date-fns';

export default function MedicationScreen() {
  const { selectedBaby } = useBaby();
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBaby) {
      fetchLogs();
    }
  }, [selectedBaby]);

  const fetchLogs = async () => {
    if (!selectedBaby) return;

    try {
      const response = await api.get(`/medication/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching medication logs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!medicationName || !dosage || !frequency) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/medication', {
        babyId: selectedBaby.id,
        medicationName,
        dosage,
        frequency,
        prescribedBy,
        startDate: new Date().toISOString(),
        notes,
      });

      Alert.alert('Éxito', 'Medicamento registrado');
      setMedicationName('');
      setDosage('');
      setFrequency('');
      setPrescribedBy('');
      setNotes('');
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <Text style={styles.logName}>{item.medicationName}</Text>
      <Text style={styles.logDosage}>Dosis: {item.dosage}</Text>
      <Text style={styles.logFrequency}>Frecuencia: {item.frequency}</Text>
      {item.prescribedBy && (
        <Text style={styles.logPrescriber}>Recetado por: {item.prescribedBy}</Text>
      )}
      <Text style={styles.logDate}>
        Inicio: {format(new Date(item.startDate), 'dd/MM/yyyy')}
        {item.endDate && ` - Fin: ${format(new Date(item.endDate), 'dd/MM/yyyy')}`}
      </Text>
      {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
      <Text style={styles.logUser}>
        Por: {item.user.firstName} {item.user.lastName}
      </Text>
    </View>
  );

  if (!selectedBaby) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Selecciona un bebé primero</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.form}>
        <Text style={styles.sectionTitle}>Registrar Medicamento</Text>

        <Text style={styles.label}>Nombre del Medicamento</Text>
        <TextInput
          style={styles.input}
          value={medicationName}
          onChangeText={setMedicationName}
          placeholder="Ej: Paracetamol, Ibuprofeno"
        />

        <Text style={styles.label}>Dosis</Text>
        <TextInput
          style={styles.input}
          value={dosage}
          onChangeText={setDosage}
          placeholder="Ej: 5ml, 100mg"
        />

        <Text style={styles.label}>Frecuencia</Text>
        <TextInput
          style={styles.input}
          value={frequency}
          onChangeText={setFrequency}
          placeholder="Ej: Cada 8 horas, 2 veces al día"
        />

        <Text style={styles.label}>Recetado por (opcional)</Text>
        <TextInput
          style={styles.input}
          value={prescribedBy}
          onChangeText={setPrescribedBy}
          placeholder="Nombre del médico"
        />

        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholder="Agregar notas..."
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>Registrar</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Registros Recientes</Text>
      </ScrollView>

      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        style={styles.logsList}
        contentContainerStyle={styles.logsContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
    padding: 15,
  },
  logCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  logName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  logDosage: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  logFrequency: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  logPrescriber: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 2,
  },
  logDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logUser: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});
