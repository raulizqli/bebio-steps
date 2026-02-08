import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>
          {user?.role === 'PARENT' ? 'Padre/Madre' : user?.role === 'NANNY' ? 'Nanny' : 'Familiar'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Cuenta</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre</Text>
          <Text style={styles.infoValue}>{user?.firstName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Apellido</Text>
          <Text style={styles.infoValue}>{user?.lastName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rol</Text>
          <Text style={styles.infoValue}>
            {user?.role === 'PARENT' ? 'Padre/Madre' : user?.role === 'NANNY' ? 'Nanny' : 'Familiar'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>
        <Text style={styles.aboutText}>
          Baby Tracker v1.0.0{'\n\n'}
          Aplicación para el seguimiento completo de tu bebé.{'\n\n'}
          Características:{'\n'}
          • Registro de alimentación{'\n'}
          • Control de sueño{'\n'}
          • Seguimiento de comidas{'\n'}
          • Registro de enfermedades{'\n'}
          • Control de medicamentos{'\n'}
          • Monitoreo del estado de ánimo{'\n'}
          • Sistema de compartir con permisos{'\n'}
          • Notificaciones de metas diarias{'\n'}
          • Integración con Alexa
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 Baby Tracker. Todos los derechos reservados.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  role: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
