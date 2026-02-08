import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, SymptomSeverity } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogSymptom'>;

const severities: { value: SymptomSeverity; label: string; color: string; emoji: string }[] = [
  { value: 'mild', label: 'Leve', color: colors.warning, emoji: '🟡' },
  { value: 'moderate', label: 'Moderado', color: '#FF8C00', emoji: '🟠' },
  { value: 'severe', label: 'Severo', color: colors.error, emoji: '🔴' },
];

export const LogSymptomScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SymptomSeverity>('mild');
  const [temperature, setTemperature] = useState('');
  const [relatedIllness, setRelatedIllness] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) { Alert.alert('Error', 'El nombre del síntoma es requerido'); return; }
    setLoading(true);
    try {
      await api.logSymptom({
        babyId, name, description: description || undefined, severity,
        observedAt: new Date().toISOString(),
        temperatureCelsius: temperature ? parseFloat(temperature) : undefined,
        relatedIllness: relatedIllness || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Síntoma registrado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Síntoma</Text>

      <Input label="Síntoma *" value={name} onChangeText={setName} placeholder="Ej: Fiebre, Tos, Vómito" />
      <Input label="Descripción" value={description} onChangeText={setDescription} placeholder="Describe el síntoma" multiline numberOfLines={2} />

      <Text style={styles.label}>Severidad</Text>
      <View style={styles.severityRow}>
        {severities.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.severityBtn, severity === s.value && { borderColor: s.color, backgroundColor: s.color + '10' }]}
            onPress={() => setSeverity(s.value)}
          >
            <Text style={styles.severityEmoji}>{s.emoji}</Text>
            <Text style={[styles.severityLabel, severity === s.value && { color: s.color, fontWeight: fontWeight.semibold }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Temperatura (°C)" value={temperature} onChangeText={setTemperature} placeholder="38.5" keyboardType="numeric" />
      <Input label="Enfermedad relacionada" value={relatedIllness} onChangeText={setRelatedIllness} placeholder="Gripe, Resfriado..." />
      <Input label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas adicionales..." multiline numberOfLines={3} />

      <Button title="Guardar Síntoma" onPress={handleSave} loading={loading} size="large" style={styles.saveButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.sm },
  severityRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  severityBtn: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  severityEmoji: { fontSize: 24, marginBottom: spacing.xs },
  severityLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  saveButton: { marginTop: spacing.md },
});
