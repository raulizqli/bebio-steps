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

const MOODS = [
  { value: 'HAPPY', label: '😊 Feliz', emoji: '😊' },
  { value: 'CALM', label: '😌 Calmado', emoji: '😌' },
  { value: 'FUSSY', label: '😠 Molesto', emoji: '😠' },
  { value: 'CRYING', label: '😭 Llorando', emoji: '😭' },
  { value: 'IRRITABLE', label: '😤 Irritable', emoji: '😤' },
  { value: 'PLAYFUL', label: '🤗 Juguetón', emoji: '🤗' },
  { value: 'SLEEPY', label: '😴 Somnoliento', emoji: '😴' },
];

export default function MoodScreen() {
  const { selectedBaby } = useBaby();
  const [mood, setMood] = useState('HAPPY');
  const [intensity, setIntensity] = useState(5);
  const [triggers, setTriggers] = useState('');
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
      const response = await api.get(`/mood/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching mood logs:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/mood', {
        babyId: selectedBaby.id,
        mood,
        intensity,
        triggers: triggers ? triggers.split(',').map((t) => t.trim()) : [],
        timestamp: new Date().toISOString(),
        notes,
      });

      Alert.alert('Éxito', 'Estado de ánimo registrado');
      setTriggers('');
      setNotes('');
      setIntensity(5);
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el estado de ánimo');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logMood}>
          {MOODS.find((m) => m.value === item.mood)?.emoji || '😊'}{' '}
          {MOODS.find((m) => m.value === item.mood)?.label.split(' ')[1] || item.mood}
        </Text>
        <Text style={styles.logTime}>
          {format(new Date(item.timestamp), 'HH:mm')}
        </Text>
      </View>
      <Text style={styles.logIntensity}>Intensidad: {item.intensity}/10</Text>
      {item.triggers.length > 0 && (
        <Text style={styles.logTriggers}>
          Desencadenantes: {item.triggers.join(', ')}
        </Text>
      )}
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
        <Text style={styles.sectionTitle}>Registrar Estado de Ánimo</Text>

        <Text style={styles.label}>Estado de Ánimo</Text>
        <View style={styles.moodGrid}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.moodButton,
                mood === m.value && styles.moodButtonActive,
              ]}
              onPress={() => setMood(m.value)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodText,
                  mood === m.value && styles.moodTextActive,
                ]}
              >
                {m.label.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Intensidad: {intensity}/10</Text>
        <View style={styles.intensityContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.intensityButton,
                intensity >= level && styles.intensityButtonActive,
              ]}
              onPress={() => setIntensity(level)}
            >
              <Text style={styles.intensityText}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Desencadenantes (opcional, separados por comas)</Text>
        <TextInput
          style={styles.input}
          value={triggers}
          onChangeText={setTriggers}
          placeholder="Hambre, Cansancio, Dolor"
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
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  moodButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FF',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  moodText: {
    fontSize: 12,
    color: '#333',
  },
  moodTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  intensityButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButtonActive: {
    backgroundColor: '#007AFF',
  },
  intensityText: {
    fontSize: 14,
    color: '#333',
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  logMood: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
  },
  logIntensity: {
    fontSize: 14,
    color: '#007AFF',
    marginVertical: 2,
  },
  logTriggers: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
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
