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
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, FeedingType, BreastSide } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogFeeding'>;

const feedingTypes: { value: FeedingType; label: string; icon: string }[] = [
  { value: 'breast', label: 'Pecho', icon: '🤱' },
  { value: 'bottle', label: 'Biberón', icon: '🍼' },
  { value: 'formula', label: 'Fórmula', icon: '🧴' },
  { value: 'mixed', label: 'Mixto', icon: '🔄' },
];

const breastSides: { value: BreastSide; label: string }[] = [
  { value: 'left', label: 'Izquierdo' },
  { value: 'right', label: 'Derecho' },
  { value: 'both', label: 'Ambos' },
];

export const LogFeedingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [type, setType] = useState<FeedingType>('bottle');
  const [amountOz, setAmountOz] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [breastSide, setBreastSide] = useState<BreastSide | undefined>();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.logFeeding({
        babyId,
        type,
        startTime: new Date().toISOString(),
        amountOz: amountOz ? parseFloat(amountOz) : undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        breastSide: type === 'breast' ? breastSide : undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Toma registrada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar la toma');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Toma</Text>

      {/* Feeding Type Selector */}
      <Text style={styles.label}>Tipo de toma</Text>
      <View style={styles.typeRow}>
        {feedingTypes.map((ft) => (
          <TouchableOpacity
            key={ft.value}
            style={[styles.typeBtn, type === ft.value && styles.typeBtnActive]}
            onPress={() => setType(ft.value)}
          >
            <Text style={styles.typeEmoji}>{ft.icon}</Text>
            <Text
              style={[styles.typeLabel, type === ft.value && styles.typeLabelActive]}
            >
              {ft.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breast Side (only for breast feeding) */}
      {type === 'breast' && (
        <>
          <Text style={styles.label}>Lado</Text>
          <View style={styles.typeRow}>
            {breastSides.map((bs) => (
              <TouchableOpacity
                key={bs.value}
                style={[
                  styles.sideBtn,
                  breastSide === bs.value && styles.typeBtnActive,
                ]}
                onPress={() => setBreastSide(bs.value)}
              >
                <Text
                  style={[
                    styles.typeLabel,
                    breastSide === bs.value && styles.typeLabelActive,
                  ]}
                >
                  {bs.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Amount */}
      <Input
        label="Cantidad (onzas)"
        value={amountOz}
        onChangeText={setAmountOz}
        placeholder="Ej: 4.5"
        keyboardType="numeric"
      />

      {/* Duration */}
      <Input
        label="Duración (minutos)"
        value={durationMinutes}
        onChangeText={setDurationMinutes}
        placeholder="Ej: 20"
        keyboardType="numeric"
      />

      {/* Notes */}
      <Input
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Agregar notas..."
        multiline
        numberOfLines={3}
      />

      <Button
        title="Guardar Toma"
        onPress={handleSave}
        loading={loading}
        size="large"
        style={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  typeEmoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  sideBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
