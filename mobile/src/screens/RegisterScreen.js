import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const result = await register({ firstName, lastName, email, password });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Crear Cuenta</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={formData.firstName}
          onChangeText={(value) => updateField('firstName', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={formData.lastName}
          onChangeText={(value) => updateField('lastName', value)}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(value) => updateField('password', value)}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar Contraseña"
          value={formData.confirmPassword}
          onChangeText={(value) => updateField('confirmPassword', value)}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#007AFF',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
