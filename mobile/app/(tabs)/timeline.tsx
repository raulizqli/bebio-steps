import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBabyStore } from '../../src/store/babyStore';
import { TimelineItem } from '../../src/components/TimelineItem';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function TimelineScreen() {
  const { currentBaby, timeline, loadTimeline } = useBabyStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (currentBaby) {
      loadTimeline(currentBaby.id, selectedDate);
    }
  }, [currentBaby, selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentBaby) await loadTimeline(currentBaby.id, selectedDate);
    setRefreshing(false);
  }, [currentBaby, selectedDate]);

  const navigateDate = (direction: -1 | 1) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + direction);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <View style={styles.container}>
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={() => navigateDate(-1)}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateDisplay}>
          <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => navigateDate(1)}
          disabled={selectedDate >= new Date().toISOString().split('T')[0]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={selectedDate >= new Date().toISOString().split('T')[0] ? Colors.textLight : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {!currentBaby ? (
          <View style={styles.emptyState}>
            <Ionicons name="baby-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Selecciona un bebé para ver el historial</Text>
          </View>
        ) : timeline.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Sin registros para este día</Text>
            <Text style={styles.emptySubtext}>Usa la pestaña "Registro" para agregar actividades</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {timeline.length} actividad{timeline.length !== 1 ? 'es' : ''} registrada{timeline.length !== 1 ? 's' : ''}
            </Text>
            {timeline.map((event) => (
              <TimelineItem key={`${event.event_type}-${event.id}`} event={event} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dateNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
