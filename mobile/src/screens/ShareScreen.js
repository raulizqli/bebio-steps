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
  Switch,
} from 'react-native';
import { useBaby } from '../context/BabyContext';
import api from '../config/api';
import { format } from 'date-fns';

const PERMISSIONS = [
  { value: 'VIEW_FEEDING', label: 'Ver Alimentación' },
  { value: 'ADD_FEEDING', label: 'Agregar Alimentación' },
  { value: 'VIEW_SLEEP', label: 'Ver Sueño' },
  { value: 'ADD_SLEEP', label: 'Agregar Sueño' },
  { value: 'VIEW_MEALS', label: 'Ver Comidas' },
  { value: 'ADD_MEALS', label: 'Agregar Comidas' },
  { value: 'VIEW_ILLNESS', label: 'Ver Enfermedades' },
  { value: 'ADD_ILLNESS', label: 'Agregar Enfermedades' },
  { value: 'VIEW_MEDICATION', label: 'Ver Medicamentos' },
  { value: 'ADD_MEDICATION', label: 'Agregar Medicamentos' },
  { value: 'VIEW_MOOD', label: 'Ver Estado de Ánimo' },
  { value: 'ADD_MOOD', label: 'Agregar Estado de Ánimo' },
];

export default function ShareScreen() {
  const { selectedBaby } = useBaby();
  const [shares, setShares] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [expirationDays, setExpirationDays] = useState('30');
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBaby) {
      fetchShares();
    }
  }, [selectedBaby]);

  const fetchShares = async () => {
    if (!selectedBaby) return;

    try {
      const response = await api.get(`/share/baby/${selectedBaby.id}`);
      setShares(response.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
    }
  };

  const handleCreateShare = async () => {
    if (selectedPermissions.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un permiso');
      return;
    }

    setLoading(true);
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));

      const response = await api.post('/share/create', {
        babyId: selectedBaby.id,
        permissions: selectedPermissions,
        expiresAt: expiresAt.toISOString(),
      });

      Alert.alert(
        'Código Creado',
        `Código para compartir: ${response.data.shareCode}\n\nComparte este código con la persona que deseas dar acceso.`,
        [{ text: 'OK' }]
      );

      setSelectedPermissions([]);
      setExpirationDays('30');
      fetchShares();
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el código');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode) {
      Alert.alert('Error', 'Ingresa un código');
      return;
    }

    setLoading(true);
    try {
      await api.post('/share/redeem', { shareCode: redeemCode });
      Alert.alert('Éxito', 'Código canjeado exitosamente');
      setRedeemCode('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    Alert.alert(
      'Revocar Acceso',
      '¿Estás seguro de revocar este acceso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/share/${shareId}`);
              Alert.alert('Éxito', 'Acceso revocado');
              fetchShares();
            } catch (error) {
              Alert.alert('Error', 'No se pudo revocar el acceso');
            }
          },
        },
      ]
    );
  };

  const togglePermission = (permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const renderShare = ({ item }) => (
    <View style={styles.shareCard}>
      <View style={styles.shareHeader}>
        <Text style={styles.shareCode}>{item.shareCode}</Text>
        <Text style={[styles.shareStatus, !item.isActive && styles.shareStatusInactive]}>
          {item.isActive ? 'Activo' : 'Inactivo'}
        </Text>
      </View>
      {item.user && (
        <Text style={styles.shareUser}>
          Usuario: {item.user.firstName} {item.user.lastName}
        </Text>
      )}
      {item.expiresAt && (
        <Text style={styles.shareExpiry}>
          Expira: {format(new Date(item.expiresAt), 'dd/MM/yyyy')}
        </Text>
      )}
      <Text style={styles.sharePermissions}>
        Permisos: {item.permissions.length}
      </Text>
      <TouchableOpacity
        style={styles.revokeButton}
        onPress={() => handleRevokeShare(item.id)}
      >
        <Text style={styles.revokeButtonText}>Revocar</Text>
      </TouchableOpacity>
    </View>
  );

  if (!selectedBaby) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Selecciona un bebé primero</Text>
      </View>
    );
  }

  if (selectedBaby.isShared) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Canjear Código</Text>
          <Text style={styles.description}>
            Ingresa un código compartido para acceder a otro bebé
          </Text>

          <TextInput
            style={styles.input}
            value={redeemCode}
            onChangeText={setRedeemCode}
            placeholder="Código de acceso"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRedeemCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Canjear Código</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Crear Código para Compartir</Text>
        <Text style={styles.description}>
          Crea un código para compartir el acceso a {selectedBaby.firstName}
        </Text>

        <Text style={styles.label}>Permisos</Text>
        {PERMISSIONS.map((permission) => (
          <View key={permission.value} style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>{permission.label}</Text>
            <Switch
              value={selectedPermissions.includes(permission.value)}
              onValueChange={() => togglePermission(permission.value)}
            />
          </View>
        ))}

        <Text style={styles.label}>Expiración (días)</Text>
        <TextInput
          style={styles.input}
          value={expirationDays}
          onChangeText={setExpirationDays}
          keyboardType="number-pad"
          placeholder="30"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleCreateShare}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Crear Código</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Códigos Activos</Text>
        <FlatList
          data={shares}
          renderItem={renderShare}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay códigos creados</Text>
          }
        />

        <Text style={styles.sectionTitle}>Canjear Código</Text>
        <Text style={styles.description}>
          Ingresa un código para acceder a otro bebé
        </Text>

        <TextInput
          style={styles.input}
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder="Código de acceso"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRedeemCode}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Canjear Código</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 5,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  shareStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  shareStatusInactive: {
    color: '#FF3B30',
  },
  shareUser: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  shareExpiry: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  sharePermissions: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  revokeButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  revokeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
