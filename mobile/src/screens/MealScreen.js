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

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Desayuno' },
  { value: 'LUNCH', label: 'Almuerzo' },
  { value: 'DINNER', label: 'Cena' },
  { value: 'SNACK', label: 'Merienda' },
];

export default function MealScreen() {
  const { selectedBaby } = useBaby();
  const [mealType, setMealType] = useState('BREAKFAST');
  const [foodItems, setFoodItems] = useState('');
  const [amountEaten, setAmountEaten] = useState('');
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
      const response = await api.get(`/meals/${selectedBaby.id}`, {
        params: { limit: 20 },
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching meal logs:', error);
    }
  };

  const handleSubmit = async () => {
    if (!foodItems) {
      Alert.alert('Error', 'Por favor ingresa los alimentos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/meals', {
        babyId: selectedBaby.id,
        mealType,
        foodItems: foodItems.split(',').map((item) => item.trim()),
        amountEaten,
        timestamp: new Date().toISOString(),
        notes,
      });

      Alert.alert('Éxito', 'Comida registrada');
      setFoodItems('');
      setAmountEaten('');
      setNotes('');
      fetchLogs();
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la comida');
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logType}>
          {MEAL_TYPES.find((t) => t.value === item.mealType)?.label}
        </Text>
        <Text style={styles.logTime}>
          {format(new Date(item.timestamp), 'HH:mm')}
        </Text>
      </View>
      <Text style={styles.logFoods}>{item.foodItems.join(', ')}</Text>
      {item.amountEaten && (
        <Text style={styles.logAmount}>Cantidad: {item.amountEaten}</Text>
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
        <Text style={styles.sectionTitle}>Registrar Comida</Text>

        <Text style={styles.label}>Tipo de Comida</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MEAL_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                mealType === type.value && styles.typeButtonActive,
              ]}
              onPress={() => setMealType(type.value)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  mealType === type.value && styles.typeButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Alimentos (separados por comas)</Text>
        <TextInput
          style={styles.input}
          value={foodItems}
          onChangeText={setFoodItems}
          placeholder="Manzana, Plátano, Cereal"
        />

        <Text style={styles.label}>Cantidad Consumida (opcional)</Text>
        <TextInput
          style={styles.input}
          value={amountEaten}
          onChangeText={setAmountEaten}
          placeholder="Ej: Toda, Media porción, etc."
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
  logFoods: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  logAmount: {
    fontSize: 14,
    color: '#666',
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
