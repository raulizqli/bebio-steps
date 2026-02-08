import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useBabyStore } from '../../src/store/babyStore';
import { FormModal } from '../../src/components/FormModal';
import * as trackingApi from '../../src/api/tracking';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

type TrackingCategory = 'feeding' | 'sleep' | 'meal' | 'symptom' | 'illness' | 'medicine' | 'mood' | null;

const categories = [
  {
    key: 'feeding' as const,
    label: 'Toma / Biberón',
    icon: 'water' as const,
    color: Colors.feeding,
    description: 'Registrar alimentación con pecho o biberón',
  },
  {
    key: 'sleep' as const,
    label: 'Sueño',
    icon: 'moon' as const,
    color: Colors.sleep,
    description: 'Registrar horas de sueño y calidad',
  },
  {
    key: 'meal' as const,
    label: 'Comida',
    icon: 'restaurant' as const,
    color: Colors.meal,
    description: 'Registrar comidas sólidas y reacciones',
  },
  {
    key: 'symptom' as const,
    label: 'Síntomas',
    icon: 'medical' as const,
    color: Colors.symptom,
    description: 'Registrar síntomas de enfermedad',
  },
  {
    key: 'illness' as const,
    label: 'Enfermedad',
    icon: 'fitness' as const,
    color: Colors.illness,
    description: 'Registrar diagnósticos y enfermedades',
  },
  {
    key: 'medicine' as const,
    label: 'Medicina',
    icon: 'medkit' as const,
    color: Colors.medicine,
    description: 'Registrar medicinas administradas',
  },
  {
    key: 'mood' as const,
    label: 'Estado de Ánimo',
    icon: 'happy' as const,
    color: Colors.mood,
    description: 'Registrar el humor y emociones',
  },
];

const formFields: Record<string, any[]> = {
  feeding: [
    {
      key: 'type', label: 'Tipo', type: 'select', required: true,
      options: [
        { label: 'Pecho', value: 'breast' },
        { label: 'Biberón', value: 'bottle' },
        { label: 'Fórmula', value: 'formula' },
        { label: 'Mixto', value: 'mixed' },
      ]
    },
    { key: 'amount_oz', label: 'Cantidad (oz)', type: 'number', placeholder: 'Ej: 4' },
    { key: 'duration_minutes', label: 'Duración (min)', type: 'number', placeholder: 'Ej: 15' },
    {
      key: 'side', label: 'Lado', type: 'select',
      options: [
        { label: 'Izquierdo', value: 'left' },
        { label: 'Derecho', value: 'right' },
        { label: 'Ambos', value: 'both' },
      ]
    },
    { key: 'notes', label: 'Notas', type: 'text', placeholder: 'Notas adicionales...' },
  ],
  sleep: [
    {
      key: 'quality', label: 'Calidad', type: 'select',
      options: [
        { label: 'Buena', value: 'good' },
        { label: 'Regular', value: 'fair' },
        { label: 'Mala', value: 'poor' },
        { label: 'Inquieto', value: 'restless' },
      ]
    },
    {
      key: 'location', label: 'Lugar', type: 'select',
      options: [
        { label: 'Cuna', value: 'crib' },
        { label: 'Cama', value: 'bed' },
        { label: 'Carriola', value: 'stroller' },
        { label: 'Auto', value: 'car_seat' },
        { label: 'Brazos', value: 'arms' },
        { label: 'Otro', value: 'other' },
      ]
    },
    { key: 'duration_hours', label: 'Duración (horas)', type: 'number', placeholder: 'Ej: 2' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ],
  meal: [
    {
      key: 'meal_type', label: 'Tipo de comida', type: 'select', required: true,
      options: [
        { label: 'Desayuno', value: 'breakfast' },
        { label: 'Comida', value: 'lunch' },
        { label: 'Cena', value: 'dinner' },
        { label: 'Snack', value: 'snack' },
      ]
    },
    { key: 'foods', label: 'Alimentos', type: 'text', required: true, placeholder: 'Ej: Puré de zanahoria' },
    {
      key: 'amount', label: 'Cantidad', type: 'select',
      options: [
        { label: 'Nada', value: 'none' },
        { label: 'Poco', value: 'little' },
        { label: 'Mitad', value: 'half' },
        { label: 'Casi todo', value: 'most' },
        { label: 'Todo', value: 'all' },
      ]
    },
    {
      key: 'reaction', label: 'Reacción', type: 'select',
      options: [
        { label: 'Le encantó', value: 'loved' },
        { label: 'Le gustó', value: 'liked' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'No le gustó', value: 'disliked' },
        { label: 'Rechazó', value: 'refused' },
      ]
    },
    { key: 'notes', label: 'Notas', type: 'text' },
  ],
  symptom: [
    { key: 'symptom_type', label: 'Síntoma', type: 'text', required: true, placeholder: 'Ej: Fiebre, tos, vómito...' },
    {
      key: 'severity', label: 'Severidad', type: 'select',
      options: [
        { label: 'Leve', value: 'mild' },
        { label: 'Moderado', value: 'moderate' },
        { label: 'Severo', value: 'severe' },
      ]
    },
    { key: 'temperature', label: 'Temperatura (°C)', type: 'number', placeholder: 'Ej: 37.5' },
    { key: 'description', label: 'Descripción', type: 'text' },
  ],
  illness: [
    { key: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Resfriado' },
    { key: 'diagnosis', label: 'Diagnóstico', type: 'text', placeholder: 'Diagnóstico médico...' },
    { key: 'doctor_name', label: 'Doctor', type: 'text', placeholder: 'Nombre del doctor' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ],
  medicine: [
    { key: 'name', label: 'Medicina', type: 'text', required: true, placeholder: 'Ej: Paracetamol' },
    { key: 'dosage', label: 'Dosis', type: 'text', required: true, placeholder: 'Ej: 2.5' },
    { key: 'dosage_unit', label: 'Unidad', type: 'select', required: true,
      options: [
        { label: 'ml', value: 'ml' },
        { label: 'mg', value: 'mg' },
        { label: 'gotas', value: 'gotas' },
        { label: 'cucharada', value: 'cucharada' },
      ]
    },
    { key: 'frequency', label: 'Frecuencia', type: 'text', placeholder: 'Ej: Cada 8 horas' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ],
  mood: [
    {
      key: 'mood', label: 'Estado de ánimo', type: 'select', required: true,
      options: [
        { label: 'Feliz', value: 'happy' },
        { label: 'Tranquilo', value: 'calm' },
        { label: 'Inquieto', value: 'fussy' },
        { label: 'Llorando', value: 'crying' },
        { label: 'Somnoliento', value: 'sleepy' },
        { label: 'Juguetón', value: 'playful' },
        { label: 'Irritable', value: 'irritable' },
        { label: 'Enfermo', value: 'sick' },
      ]
    },
    {
      key: 'intensity', label: 'Intensidad', type: 'select',
      options: [
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
      ]
    },
    { key: 'context', label: 'Contexto', type: 'text', placeholder: 'Ej: Después de comer' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ],
};

export default function TrackingScreen() {
  const [activeCategory, setActiveCategory] = useState<TrackingCategory>(null);
  const { currentBaby, loadSummary, loadTimeline } = useBabyStore();

  const handleSubmit = async (category: string, data: Record<string, any>) => {
    if (!currentBaby) {
      Alert.alert('Error', 'Selecciona un bebé primero');
      return;
    }

    const now = new Date().toISOString();

    switch (category) {
      case 'feeding':
        await trackingApi.logFeeding({
          baby_id: currentBaby.id,
          type: data.type,
          amount_oz: data.amount_oz,
          duration_minutes: data.duration_minutes,
          side: data.side,
          notes: data.notes,
          started_at: now,
          ended_at: data.duration_minutes
            ? new Date(Date.now() + (data.duration_minutes || 0) * 60000).toISOString()
            : undefined,
        });
        break;
      case 'sleep': {
        const durationHours = parseFloat(data.duration_hours) || 2;
        const startedAt = new Date(Date.now() - durationHours * 3600000).toISOString();
        await trackingApi.logSleep({
          baby_id: currentBaby.id,
          started_at: startedAt,
          ended_at: now,
          quality: data.quality,
          location: data.location,
          notes: data.notes,
        });
        break;
      }
      case 'meal':
        await trackingApi.logMeal({
          baby_id: currentBaby.id,
          meal_type: data.meal_type,
          foods: data.foods,
          amount: data.amount,
          reaction: data.reaction,
          notes: data.notes,
          recorded_at: now,
        });
        break;
      case 'symptom':
        await trackingApi.logSymptom({
          baby_id: currentBaby.id,
          symptom_type: data.symptom_type,
          severity: data.severity,
          temperature: data.temperature,
          description: data.description,
          recorded_at: now,
        });
        break;
      case 'illness':
        await trackingApi.logIllness({
          baby_id: currentBaby.id,
          name: data.name,
          diagnosis: data.diagnosis,
          doctor_name: data.doctor_name,
          notes: data.notes,
          started_at: now,
        });
        break;
      case 'medicine':
        await trackingApi.logMedicine({
          baby_id: currentBaby.id,
          name: data.name,
          dosage: data.dosage,
          dosage_unit: data.dosage_unit,
          frequency: data.frequency,
          notes: data.notes,
          administered_at: now,
        });
        break;
      case 'mood':
        await trackingApi.logMood({
          baby_id: currentBaby.id,
          mood: data.mood,
          intensity: data.intensity ? parseInt(data.intensity) : undefined,
          context: data.context,
          notes: data.notes,
          recorded_at: now,
        });
        break;
    }

    // Refresh data
    loadSummary(currentBaby.id);
    loadTimeline(currentBaby.id);
    Alert.alert('Registrado', 'Se guardó correctamente');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Registrar Actividad</Text>
        <Text style={styles.subheader}>
          {currentBaby ? `Para ${currentBaby.name}` : 'Selecciona un bebé primero'}
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryCard, { borderColor: cat.color + '40' }]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                <Ionicons name={cat.icon} size={28} color={cat.color} />
              </View>
              <Text style={styles.categoryLabel}>{cat.label}</Text>
              <Text style={styles.categoryDesc}>{cat.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {activeCategory && (
        <FormModal
          visible={true}
          title={categories.find((c) => c.key === activeCategory)?.label || ''}
          fields={formFields[activeCategory] || []}
          color={categories.find((c) => c.key === activeCategory)?.color}
          onSubmit={(data) => handleSubmit(activeCategory, data)}
          onClose={() => setActiveCategory(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  subheader: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  categoryGrid: {
    gap: Spacing.md,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryLabel: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  categoryDesc: {
    display: 'none', // Hidden for compact view
  },
});
