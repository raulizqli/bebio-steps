import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, MealType } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LogMeal'>;

const mealTypes: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Desayuno', emoji: '🌅' },
  { value: 'lunch', label: 'Comida', emoji: '☀️' },
  { value: 'dinner', label: 'Cena', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
];

export const LogMealScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [type, setType] = useState<MealType>('lunch');
  const [foods, setFoods] = useState('');
  const [amountOz, setAmountOz] = useState('');
  const [texture, setTexture] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.logMeal({
        babyId,
        type,
        time: new Date().toISOString(),
        foods: foods ? foods.split(',').map((f) => f.trim()) : undefined,
        amountOz: amountOz ? parseFloat(amountOz) : undefined,
        texture: texture || undefined,
        rating: rating || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Listo', 'Comida registrada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo registrar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Comida</Text>

      <Text style={styles.label}>Tipo de comida</Text>
      <View style={styles.typeRow}>
        {mealTypes.map((mt) => (
          <TouchableOpacity
            key={mt.value}
            style={[styles.typeBtn, type === mt.value && styles.typeBtnActive]}
            onPress={() => setType(mt.value)}
          >
            <Text style={styles.typeEmoji}>{mt.emoji}</Text>
            <Text style={[styles.typeLabel, type === mt.value && styles.typeLabelActive]}>
              {mt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Alimentos (separados por coma)"
        value={foods}
        onChangeText={setFoods}
        placeholder="aguacate, plátano, cereal"
      />

      <Input
        label="Cantidad (oz)"
        value={amountOz}
        onChangeText={setAmountOz}
        placeholder="2.0"
        keyboardType="numeric"
      />

      <Input
        label="Textura"
        value={texture}
        onChangeText={setTexture}
        placeholder="puré, trocitos, líquido"
      />

      <Text style={styles.label}>¿Le gustó?</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input label="Notas" value={notes} onChangeText={setNotes} placeholder="Notas..." multiline numberOfLines={3} />

      <Button title="Guardar Comida" onPress={handleSave} loading={loading} size="large" style={styles.saveButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  typeBtn: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  typeBtnActive: { borderColor: colors.meal, backgroundColor: colors.meal + '10' },
  typeEmoji: { fontSize: 24, marginBottom: spacing.xs },
  typeLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.textSecondary },
  typeLabelActive: { color: colors.meal, fontWeight: fontWeight.semibold },
  ratingRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, justifyContent: 'center' },
  star: { fontSize: 32 },
  saveButton: { marginTop: spacing.md },
});
