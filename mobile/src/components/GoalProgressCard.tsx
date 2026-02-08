import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import type { DailyGoal } from '../types';

interface GoalProgressCardProps {
  goal: DailyGoal;
}

const goalConfig: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; unit: string; color: string }> = {
  feeding_oz: { label: 'Alimentación', icon: 'water', unit: 'oz', color: Colors.feeding },
  sleep_hours: { label: 'Sueño', icon: 'moon', unit: 'hrs', color: Colors.sleep },
  meals_count: { label: 'Comidas', icon: 'restaurant', unit: '', color: Colors.meal },
};

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const config = goalConfig[goal.goal_type] || { label: goal.goal_type, icon: 'flag', unit: '', color: Colors.primary };
  const percentage = goal.percentage || 0;
  const current = goal.current_value || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon} size={18} color={config.color} />
        </View>
        <Text style={styles.label}>{config.label}</Text>
        {goal.met && (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        )}
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: goal.met ? Colors.success : config.color,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.currentValue}>
          {current.toFixed(1)} {config.unit}
        </Text>
        <Text style={styles.targetValue}>
          / {goal.target_value} {config.unit} ({percentage}%)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  progressBarContainer: {
    marginBottom: Spacing.xs,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  targetValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
