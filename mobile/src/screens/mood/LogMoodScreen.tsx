import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MoodType } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { moodEmoji, moodLabels, colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { api } from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'LogMood'>;

const moods: MoodType[] = ['happy', 'calm', 'playful', 'sleepy', 'fussy', 'crying', 'irritable', 'sick'];

export const LogMoodScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy');
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.logMood({
        babyId,
        mood: selectedMood,
        intensityLevel: intensity,
        observedAt: new Date().toISOString(),
        trigger: trigger || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Estado de ánimo registrado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Estado de Ánimo</Text>

      <Text style={styles.label}>¿Cómo se siente tu bebé?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[styles.moodBtn, selectedMood === mood && styles.moodBtnActive]}
            onPress={() => setSelectedMood(mood)}
          >
            <Text style={styles.moodEmoji}>{moodEmoji[mood]}</Text>
            <Text style={[styles.moodLabel, selectedMood === mood && styles.moodLabelActive]}>
              {moodLabels[mood]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Intensidad</Text>
      <View style={styles.intensityRow}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.intensityBtn, intensity === level && styles.intensityBtnActive]}
            onPress={() => setIntensity(level)}
          >
            <Text style={[styles.intensityText, intensity === level && styles.intensityTextActive]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="¿Qué lo provocó?" value={trigger} onChangeText={setTrigger} placeholder="Hambre, cansancio, dolor..." />
      <Input label="Duración (min)" value={durationMinutes} onChangeText={setDurationMinutes} placeholder="30" keyboardType="numeric" />
      <Input label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas..." multiline numberOfLines={3} />

      <Button title="Guardar Estado" onPress={handleSave} loading={loading} size="large" style={styles.saveButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.sm },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'center' },
  moodBtn: {
    width: '22%', alignItems: 'center', padding: spacing.sm, borderRadius: borderRadius.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  moodBtnActive: { borderColor: colors.mood, backgroundColor: colors.mood + '10' },
  moodEmoji: { fontSize: 28, marginBottom: 2 },
  moodLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
  moodLabelActive: { color: colors.mood, fontWeight: fontWeight.semibold },
  intensityRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, justifyContent: 'center' },
  intensityBtn: {
    width: 44, height: 44, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
  },
  intensityBtnActive: { borderColor: colors.mood, backgroundColor: colors.mood },
  intensityText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  intensityTextActive: { color: colors.textInverse },
  saveButton: { marginTop: spacing.md },
});
