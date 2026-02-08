import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createBaby } from '../../store/slices/babiesSlice';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddBaby'>;

export const AddBabyScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [birthWeightKg, setBirthWeightKg] = useState('');
  const [birthHeightCm, setBirthHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName || !dateOfBirth) {
      Alert.alert('Error', 'El nombre y fecha de nacimiento son requeridos');
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        createBaby({
          firstName,
          lastName: lastName || undefined,
          dateOfBirth,
          gender: gender || undefined,
          birthWeightKg: birthWeightKg ? parseFloat(birthWeightKg) : undefined,
          birthHeightCm: birthHeightCm ? parseFloat(birthHeightCm) : undefined,
          notes: notes || undefined,
        }),
      ).unwrap();

      Alert.alert('Listo', `${firstName} ha sido registrado correctamente`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'No se pudo registrar al bebé');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Bebé</Text>
      <Text style={styles.subtitle}>
        Ingresa los datos de tu bebé para comenzar el seguimiento
      </Text>

      <Input
        label="Nombre *"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Nombre del bebé"
      />

      <Input
        label="Apellido"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Apellido"
      />

      <Input
        label="Fecha de nacimiento * (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="2025-06-15"
      />

      <Text style={styles.label}>Género</Text>
      <View style={styles.genderRow}>
        {[
          { value: 'female', label: 'Niña', emoji: '👧' },
          { value: 'male', label: 'Niño', emoji: '👦' },
        ].map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[styles.genderBtn, gender === g.value && styles.genderBtnActive]}
            onPress={() => setGender(g.value)}
          >
            <Text style={styles.genderEmoji}>{g.emoji}</Text>
            <Text
              style={[styles.genderLabel, gender === g.value && styles.genderLabelActive]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <Input
          label="Peso al nacer (kg)"
          value={birthWeightKg}
          onChangeText={setBirthWeightKg}
          placeholder="3.2"
          keyboardType="numeric"
          style={styles.halfInput}
        />
        <Input
          label="Talla al nacer (cm)"
          value={birthHeightCm}
          onChangeText={setBirthHeightCm}
          placeholder="50"
          keyboardType="numeric"
          style={styles.halfInput}
        />
      </View>

      <Input
        label="Notas"
        value={notes}
        onChangeText={setNotes}
        placeholder="Notas adicionales..."
        multiline
        numberOfLines={3}
      />

      <Button
        title="Registrar Bebé"
        onPress={handleSave}
        loading={loading}
        disabled={!firstName || !dateOfBirth}
        size="large"
        style={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  genderEmoji: { fontSize: 32, marginBottom: spacing.xs },
  genderLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  genderLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  saveButton: { marginTop: spacing.md },
});
