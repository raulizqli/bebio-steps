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

const SLEEP_QUALITY = [
  { value: 'POOR', label: 'Pobre' },
  { value: 'FAIR', label: 'Regular' },
  { value: 'GOOD', label: 'Buena' },
  { value: 'EXCELLENT', label: 'Excelente' },
];

export default function SleepScreen() {
  const { selectedBaby } = useBaby();
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [quality, setQuality] = useState('GOOD');
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
      const response = await api.get(`/sleep/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching sleep logs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!durationHours) {
      Alert.alert('Error', 'Por favor ingresa la duración del sueño');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const start = startTime
        ? new Date(startTime)
        : new Date(now.getTime() - parseFloat(durationHours) * 60 * 60 * 1000);

      await api.post('/sleep', {
        babyId: selectedBaby.id,
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        quality,
        notes,
      });

      Alert.alert('Éxito', 'Sueño registrado');
      setStartTime('');
      setDurationHours('');
      setNotes('');
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el sueño');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => {
    const duration = item.endTime
      ? ((new Date(item.endTime) - new Date(item.startTime)) / (1000 * 60 * 60)).toFixed(1)
      : 'En progreso';

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <Text style={styles.logTime}>
            {format(new Date(item.startTime), 'HH:mm')}
            {item.endTime && ` - ${format(new Date(item.endTime), 'HH:mm')}`}
          </Text>
          {item.quality && (
            <Text style={styles.logQuality}>
              {SLEEP_QUALITY.find((q) => q.value === item.quality)?.label}
            </Text>
          )}
        </View>
        <Text style={styles.logDuration}>
          {typeof duration === 'number' ? `${duration} horas` : duration}
        </Text>
        {item.notes && <Text style={styles.logNotes}>{item.notes}</Text>}
        <Text style={styles.logUser}>
          Por: {item.user.firstName} {item.user.lastName}
        </Text>
      </View>
    );
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
        <Text style={styles.sectionTitle}>Registrar Sueño</Text>

        <Text style={styles.label}>Duración (horas)</Text>
        <TextInput
          style={styles.input}
          value={durationHours}
          onChangeText={setDurationHours}
          keyboardType="decimal-pad"
          placeholder="2.5"
        />

        <Text style={styles.label}>Calidad del Sueño</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SLEEP_QUALITY.map((q) => (
            <TouchableOpacity
              key={q.value}
              style={[
                styles.qualityButton,
                quality === q.value && styles.qualityButtonActive,
              ]}
              onPress={() => setQuality(q.value)}
            >
              <Text
                style={[
                  styles.qualityButtonText,
                  quality === q.value && styles.qualityButtonTextActive,
                ]}
              >
                {q.label}
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
  qualityButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  qualityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  qualityButtonTextActive: {
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
    marginBottom: 5,
  },
  logTime: {
    fontSize: 14,
    color: '#666',
  },
  logQuality: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  logDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
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
