import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogMedicine'>;

export const LogMedicineScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('ml');
  const [frequency, setFrequency] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) { Alert.alert('Error', 'El nombre de la medicina es requerido'); return; }
    setLoading(true);
    try {
      await api.logMedicine({
        babyId, name,
        dosage: dosage || undefined,
        unit: unit || undefined,
        frequency: frequency || undefined,
        administeredAt: new Date().toISOString(),
        prescribedBy: prescribedBy || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Medicina registrada', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Medicina</Text>
      <Input label="Medicina *" value={name} onChangeText={setName} placeholder="Ej: Acetaminofén (Tylenol)" />
      <View style={styles.row}>
        <Input label="Dosis" value={dosage} onChangeText={setDosage} placeholder="2.5" keyboardType="numeric" style={styles.half} />
        <Input label="Unidad" value={unit} onChangeText={setUnit} placeholder="ml" style={styles.half} />
      </View>
      <Input label="Frecuencia" value={frequency} onChangeText={setFrequency} placeholder="Cada 6 horas" />
      <Input label="Recetada por" value={prescribedBy} onChangeText={setPrescribedBy} placeholder="Dr. García" />
      <Input label="Razón" value={reason} onChangeText={setReason} placeholder="Fiebre" />
      <Input label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas..." multiline numberOfLines={3} />
      <Button title="Guardar Medicina" onPress={handleSave} loading={loading} size="large" style={styles.saveButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  saveButton: { marginTop: spacing.md },
});
