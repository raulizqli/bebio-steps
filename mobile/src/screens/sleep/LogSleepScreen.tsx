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
import { RootStackParamList, SleepType } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogSleep'>;

export const LogSleepScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [type, setType] = useState<SleepType>('nap');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const totalMinutes =
        (parseInt(durationHours || '0') * 60) + parseInt(durationMinutes || '0');
      const now = new Date();
      const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

      await api.logSleep({
        babyId,
        type,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        qualityRating: qualityRating || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Sueño registrado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Sueño</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'nap' && styles.typeBtnActive]}
          onPress={() => setType('nap')}
        >
          <Text style={styles.typeEmoji}>😴</Text>
          <Text style={[styles.typeLabel, type === 'nap' && styles.typeLabelActive]}>
            Siesta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'night' && styles.typeBtnActive]}
          onPress={() => setType('night')}
        >
          <Text style={styles.typeEmoji}>🌙</Text>
          <Text style={[styles.typeLabel, type === 'night' && styles.typeLabelActive]}>
            Noche
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Duración</Text>
      <View style={styles.durationRow}>
        <View style={styles.durationInput}>
          <Input
            label="Horas"
            value={durationHours}
            onChangeText={setDurationHours}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.durationInput}>
          <Input
            label="Minutos"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Calidad del sueño</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setQualityRating(star)}>
            <Text style={styles.star}>
              {star <= qualityRating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Agregar notas..."
        multiline
        numberOfLines={3}
      />

      <Button
        title="Guardar Sueño"
        onPress={handleSave}
        loading={loading}
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  typeBtnActive: {
    borderColor: colors.sleep,
    backgroundColor: colors.sleep + '10',
  },
  typeEmoji: { fontSize: 32, marginBottom: spacing.sm },
  typeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  typeLabelActive: { color: colors.sleep, fontWeight: fontWeight.semibold },
  durationRow: { flexDirection: 'row', gap: spacing.md },
  durationInput: { flex: 1 },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  star: { fontSize: 32 },
  saveButton: { marginTop: spacing.md },
});
