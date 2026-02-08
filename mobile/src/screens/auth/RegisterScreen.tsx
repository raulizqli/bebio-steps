import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { register, clearError } from '../../store/slices/authSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleRegister = () => {
    if (!firstName || !lastName || !email || !password) return;
    dispatch(register({ firstName, lastName, email, password, phone: phone || undefined }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>
          Registra tu cuenta de padre/madre para comenzar
        </Text>

        <View style={styles.form}>
          <View style={styles.row}>
            <Input
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="María"
              style={styles.halfInput}
            />
            <Input
              label="Apellido"
              value={lastName}
              onChangeText={setLastName}
              placeholder="García"
              style={styles.halfInput}
            />
          </View>

          <Input
            label="Correo electrónico"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) dispatch(clearError());
            }}
            placeholder="tu@email.com"
            keyboardType="email-address"
          />

          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
          />

          <Input
            label="Teléfono (opcional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+52 555 123 4567"
            keyboardType="phone-pad"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Crear Cuenta"
            onPress={handleRegister}
            loading={isLoading}
            disabled={!firstName || !lastName || !email || !password}
            size="large"
            style={styles.registerButton}
          />

          <Button
            title="¿Ya tienes cuenta? Inicia sesión"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
