import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useBabyStore } from '../../src/store/babyStore';
import { QuickActionButton } from '../../src/components/QuickActionButton';
import { GoalProgressCard } from '../../src/components/GoalProgressCard';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function HomeScreen() {
  const { user, currentFamily } = useAuthStore();
  const { babies, currentBaby, summary, loadBabies, loadSummary } = useBabyStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (currentFamily) {
      loadBabies(currentFamily.id);
    }
  }, [currentFamily]);

  useEffect(() => {
    if (currentBaby) {
      loadSummary(currentBaby.id);
    }
  }, [currentBaby]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentFamily) await loadBabies(currentFamily.id);
    if (currentBaby) await loadSummary(currentBaby.id);
    setRefreshing(false);
  }, [currentFamily, currentBaby]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getAgeText = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 1) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} días`;
    }
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} año${years > 1 ? 's' : ''}${remainingMonths ? ` ${remainingMonths} m` : ''}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Baby Card */}
      {currentBaby ? (
        <View style={styles.babyCard}>
          <View style={styles.babyAvatarContainer}>
            <Ionicons
              name={currentBaby.gender === 'female' ? 'flower' : 'rocket'}
              size={32}
              color={Colors.primary}
            />
          </View>
          <View style={styles.babyInfo}>
            <Text style={styles.babyName}>{currentBaby.name}</Text>
            <Text style={styles.babyAge}>{getAgeText(currentBaby.birth_date)}</Text>
          </View>
          {babies.length > 1 && (
            <TouchableOpacity style={styles.switchBabyBtn}>
              <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="happy-outline" size={48} color={Colors.textLight} />
          <Text style={styles.emptyText}>Agrega a tu bebé para comenzar</Text>
        </View>
      )}

      {/* Today's Summary */}
      {summary && (
        <>
          <Text style={styles.sectionTitle}>Resumen de hoy</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryItem, { backgroundColor: Colors.feeding + '12' }]}>
              <Ionicons name="water" size={22} color={Colors.feeding} />
              <Text style={styles.summaryValue}>{summary.feedings.total_oz.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>oz hoy</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: Colors.sleep + '12' }]}>
              <Ionicons name="moon" size={22} color={Colors.sleep} />
              <Text style={styles.summaryValue}>{summary.sleep.total_hours.toFixed(1)}</Text>
              <Text style={styles.summaryLabel}>hrs sueño</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: Colors.meal + '12' }]}>
              <Ionicons name="restaurant" size={22} color={Colors.meal} />
              <Text style={styles.summaryValue}>{summary.meals.count}</Text>
              <Text style={styles.summaryLabel}>comidas</Text>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: Colors.mood + '12' }]}>
              <Ionicons name="happy" size={22} color={Colors.mood} />
              <Text style={styles.summaryValue}>
                {summary.moods ? (summary.moods as any).mood || '-' : '-'}
              </Text>
              <Text style={styles.summaryLabel}>ánimo</Text>
            </View>
          </View>

          {/* Goal Progress */}
          {summary.goal_progress && summary.goal_progress.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Metas del día</Text>
              {summary.goal_progress.map((goal) => (
                <GoalProgressCard key={goal.id} goal={goal} />
              ))}
            </>
          )}
        </>
      )}

      {/* Health Overview */}
      {summary && (summary.symptoms.count > 0 || summary.medicines.count > 0) && (
        <>
          <Text style={styles.sectionTitle}>Salud</Text>
          <View style={styles.healthCard}>
            {summary.symptoms.count > 0 && (
              <View style={styles.healthItem}>
                <Ionicons name="medical" size={20} color={Colors.symptom} />
                <Text style={styles.healthText}>
                  {summary.symptoms.count} síntoma{summary.symptoms.count > 1 ? 's' : ''} activo{summary.symptoms.count > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {summary.medicines.count > 0 && (
              <View style={styles.healthItem}>
                <Ionicons name="medkit" size={20} color={Colors.medicine} />
                <Text style={styles.healthText}>
                  {summary.medicines.count} medicina{summary.medicines.count > 1 ? 's' : ''} hoy
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
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
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  babyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  babyAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  babyInfo: {
    flex: 1,
  },
  babyName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  babyAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  switchBabyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  healthCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  healthText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
});
