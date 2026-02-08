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

const SEVERITY_LEVELS = [
  { value: 'MILD', label: 'Leve' },
  { value: 'MODERATE', label: 'Moderada' },
  { value: 'SEVERE', label: 'Severa' },
];

export default function IllnessScreen() {
  const { selectedBaby } = useBaby();
  const [illnessName, setIllnessName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('MILD');
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
      const response = await api.get(`/illness/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching illness logs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!illnessName || !symptoms) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/illness', {
        babyId: selectedBaby.id,
        illnessName,
        symptoms: symptoms.split(',').map((s) => s.trim()),
        severity,
        startDate: new Date().toISOString(),
        notes,
      });

      Alert.alert('Éxito', 'Enfermedad registrada');
      setIllnessName('');
      setSymptoms('');
      setNotes('');
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la enfermedad');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logName}>{item.illnessName}</Text>
        <Text style={[styles.logSeverity, { color: getSeverityColor(item.severity) }]}>
          {SEVERITY_LEVELS.find((s) => s.value === item.severity)?.label}
        </Text>
      </View>
      <Text style={styles.logSymptoms}>
        Síntomas: {item.symptoms.join(', ')}
      </Text>
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'MILD':
        return '#34C759';
      case 'MODERATE':
        return '#FF9500';
      case 'SEVERE':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

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
        <Text style={styles.sectionTitle}>Registrar Enfermedad</Text>

        <Text style={styles.label}>Nombre de la Enfermedad</Text>
        <TextInput
          style={styles.input}
          value={illnessName}
          onChangeText={setIllnessName}
          placeholder="Ej: Resfriado, Fiebre, etc."
        />

        <Text style={styles.label}>Síntomas (separados por comas)</Text>
        <TextInput
          style={styles.input}
          value={symptoms}
          onChangeText={setSymptoms}
          placeholder="Tos, Fiebre, Congestión"
        />

        <Text style={styles.label}>Severidad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SEVERITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.severityButton,
                severity === level.value && styles.severityButtonActive,
              ]}
              onPress={() => setSeverity(level.value)}
            >
              <Text
                style={[
                  styles.severityButtonText,
                  severity === level.value && styles.severityButtonTextActive,
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
  severityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  severityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  severityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  severityButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  logName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  logSeverity: {
    fontSize: 14,
    fontWeight: '600',
  },
  logSymptoms: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  logDate: {
    fontSize: 12,
    color: '#999',
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
