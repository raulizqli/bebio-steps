import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import type { TimelineEvent } from '../types';

interface TimelineItemProps {
  event: TimelineEvent;
}

const eventConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  feeding: { icon: 'water', color: Colors.feeding, label: 'Toma' },
  sleep: { icon: 'moon', color: Colors.sleep, label: 'Sueño' },
  meal: { icon: 'restaurant', color: Colors.meal, label: 'Comida' },
  symptom: { icon: 'medical', color: Colors.symptom, label: 'Síntoma' },
  medicine: { icon: 'medkit', color: Colors.medicine, label: 'Medicina' },
  mood: { icon: 'happy', color: Colors.mood, label: 'Ánimo' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function getEventDetails(event: TimelineEvent): string {
  switch (event.event_type) {
    case 'feeding':
      return `${event.type === 'breast' ? 'Pecho' : 'Biberón'}${event.amount_oz ? ` - ${event.amount_oz} oz` : ''}${event.duration_minutes ? ` - ${event.duration_minutes} min` : ''}`;
    case 'sleep': {
      if (event.ended_at) {
        const start = new Date(event.event_time);
        const end = new Date(event.ended_at);
        const hours = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
        return `${hours} horas${event.quality ? ` - ${event.quality}` : ''}`;
      }
      return 'En curso...';
    }
    case 'meal':
      return `${event.meal_type}: ${event.foods}${event.amount ? ` (${event.amount})` : ''}`;
    case 'symptom':
      return `${event.symptom_type}${event.severity ? ` - ${event.severity}` : ''}${event.temperature ? ` - ${event.temperature}°C` : ''}`;
    case 'medicine':
      return `${event.name} ${event.dosage} ${event.dosage_unit}`;
    case 'mood':
      return `${event.mood}${event.intensity ? ` (${event.intensity}/5)` : ''}`;
    default:
      return '';
  }
}

export function TimelineItem({ event }: TimelineItemProps) {
  const config = eventConfig[event.event_type] || { icon: 'ellipse', color: Colors.primary, label: event.event_type };
  const details = getEventDetails(event);

  return (
    <View style={styles.container}>
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{formatTime(event.event_time)}</Text>
      </View>

      <View style={styles.indicator}>
        <View style={[styles.dot, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={14} color={Colors.textOnPrimary} />
        </View>
        <View style={[styles.line, { backgroundColor: config.color + '30' }]} />
      </View>

      <View style={[styles.card, { borderLeftColor: config.color }]}>
        <Text style={[styles.eventLabel, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.details}>{details}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  timeColumn: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  indicator: {
    width: 30,
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 2,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  eventLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  details: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 18,
  },
});
