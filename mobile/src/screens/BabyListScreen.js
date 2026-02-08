import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useBaby } from '../context/BabyContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BabyListScreen({ navigation }) {
  const { babies, selectedBaby, setSelectedBaby, deleteBaby } = useBaby();

  const handleDelete = (baby) => {
    if (baby.isShared) {
      Alert.alert('Error', 'No puedes eliminar un bebé compartido');
      return;
    }

    Alert.alert(
      'Eliminar Bebé',
      `¿Estás seguro de eliminar a ${baby.firstName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteBaby(baby.id);
            if (!result.success) {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const renderBaby = ({ item }) => (
    <View style={styles.babyCard}>
      <TouchableOpacity
        style={styles.babyInfo}
        onPress={() => setSelectedBaby(item)}
      >
        <Text style={styles.babyName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.babyDetails}>
          Nacimiento: {format(new Date(item.dateOfBirth), "d 'de' MMMM, yyyy", { locale: es })}
        </Text>
        {item.isShared && (
          <Text style={styles.sharedBadge}>Compartido</Text>
        )}
      </TouchableOpacity>

      {!item.isShared && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={babies}
        renderItem={renderBaby}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay bebés registrados</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBaby')}
      >
        <Text style={styles.addButtonText}>+ Agregar Bebé</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 15,
  },
  babyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  babyInfo: {
    flex: 1,
  },
  babyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  babyDetails: {
    fontSize: 14,
    color: '#666',
  },
  sharedBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});
