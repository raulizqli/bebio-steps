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

const FEEDING_TYPES = [
  { value: 'BOTTLE', label: 'Biberón' },
  { value: 'BREAST_LEFT', label: 'Pecho Izquierdo' },
  { value: 'BREAST_RIGHT', label: 'Pecho Derecho' },
  { value: 'BREAST_BOTH', label: 'Ambos Pechos' },
  { value: 'SOLID', label: 'Sólidos' },
];

export default function FeedingScreen() {
  const { selectedBaby } = useBaby();
  const [feedingType, setFeedingType] = useState('BOTTLE');
  const [amountOz, setAmountOz] = useState('');
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
      const response = await api.get(`/feeding/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching feeding logs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amountOz) {
      Alert.alert('Error', 'Por favor ingresa la cantidad');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feeding', {
        babyId: selectedBaby.id,
        type: feedingType,
        amountOz: parseFloat(amountOz),
        startTime: new Date().toISOString(),
        notes,
      });

      Alert.alert('Éxito', 'Alimentación registrada');
      setAmountOz('');
      setNotes('');
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la alimentación');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logType}>
          {FEEDING_TYPES.find((t) => t.value === item.type)?.label}
        </Text>
        <Text style={styles.logTime}>
          {format(new Date(item.startTime), 'HH:mm')}
        </Text>
      </View>
      <Text style={styles.logAmount}>{item.amountOz} oz</Text>
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
        <Text style={styles.sectionTitle}>Registrar Alimentación</Text>

        <Text style={styles.label}>Tipo de Alimentación</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FEEDING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                feedingType === type.value && styles.typeButtonActive,
              ]}
              onPress={() => setFeedingType(type.value)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  feedingType === type.value && styles.typeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Cantidad (oz)</Text>
        <TextInput
          style={styles.input}
          value={amountOz}
          onChangeText={setAmountOz}
          keyboardType="decimal-pad"
          placeholder="0.0"
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
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  logType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
  },
  logAmount: {
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
