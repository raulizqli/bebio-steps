import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { fetchBabies } from '../../store/slices/babiesSlice';
import { TrackingCard } from '../../components/common/TrackingCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';
import { FeedingSummary, SleepSummary } from '../../types';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { babies, selectedBaby } = useAppSelector((state) => state.babies);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [feedingSummary, setFeedingSummary] = useState<FeedingSummary | null>(null);
  const [sleepSummary, setSleepSummary] = useState<SleepSummary | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    await dispatch(fetchBabies());
  }, [dispatch]);

  const loadSummaries = useCallback(async () => {
    if (!selectedBaby) return;
    try {
      const [feeding, sleep] = await Promise.all([
        api.getFeedingSummary(selectedBaby.id, today),
        api.getSleepSummary(selectedBaby.id, today),
      ]);
      setFeedingSummary(feeding);
      setSleepSummary(sleep);
    } catch (error) {
      console.log('Error loading summaries:', error);
    }
  }, [selectedBaby, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadSummaries();
    setRefreshing(false);
  };

  const getAgeText = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 1) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} días`;
    }
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} meses` : `${years} año${years > 1 ? 's' : ''}`;
  };

  if (babies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="happy-outline" size={80} color={colors.primary} />
        <Text style={styles.emptyTitle}>¡Bienvenido a BebIO Steps!</Text>
        <Text style={styles.emptySubtitle}>
          Comienza registrando a tu bebé para hacer seguimiento de sus actividades
        </Text>
        <Button
          title="Registrar Bebé"
          onPress={() => navigation.navigate('AddBaby')}
          size="large"
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hola, {user?.firstName} 👋
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Baby Info Card */}
      {selectedBaby && (
        <Card
          style={styles.babyCard}
          onPress={() => navigation.navigate('BabyDetail', { babyId: selectedBaby.id })}
        >
          <View style={styles.babyCardContent}>
            <View style={styles.babyAvatar}>
              <Text style={styles.babyAvatarText}>
                {selectedBaby.firstName[0]}
              </Text>
            </View>
            <View style={styles.babyInfo}>
              <Text style={styles.babyName}>
                {selectedBaby.firstName} {selectedBaby.lastName || ''}
              </Text>
              <Text style={styles.babyAge}>
                {getAgeText(selectedBaby.dateOfBirth)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </View>
        </Card>
      )}

      {/* Daily Summary */}
      <Text style={styles.sectionTitle}>Resumen del Día</Text>
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Ionicons name="nutrition-outline" size={22} color={colors.feeding} />
          <Text style={styles.summaryValue}>
            {feedingSummary?.totalOz?.toFixed(1) || '0'} oz
          </Text>
          <Text style={styles.summaryLabel}>
            {feedingSummary?.totalFeedings || 0} tomas
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Ionicons name="moon-outline" size={22} color={colors.sleep} />
          <Text style={styles.summaryValue}>
            {sleepSummary?.totalSleepHours?.toFixed(1) || '0'} hrs
          </Text>
          <Text style={styles.summaryLabel}>
            {sleepSummary?.napCount || 0} siestas
          </Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Registrar Actividad</Text>
      <View style={styles.trackingGrid}>
        <TrackingCard
          title="Toma"
          icon="nutrition-outline"
          color={colors.feeding}
          onPress={() => navigation.navigate('LogFeeding', { babyId: selectedBaby?.id })}
        />
        <TrackingCard
          title="Sueño"
          icon="moon-outline"
          color={colors.sleep}
          onPress={() => navigation.navigate('LogSleep', { babyId: selectedBaby?.id })}
        />
        <TrackingCard
          title="Comida"
          icon="restaurant-outline"
          color={colors.meal}
          onPress={() => navigation.navigate('LogMeal', { babyId: selectedBaby?.id })}
        />
        <TrackingCard
          title="Síntomas"
          icon="thermometer-outline"
          color={colors.symptom}
          onPress={() => navigation.navigate('LogSymptom', { babyId: selectedBaby?.id })}
        />
        <TrackingCard
          title="Medicina"
          icon="medkit-outline"
          color={colors.medicine}
          onPress={() => navigation.navigate('LogMedicine', { babyId: selectedBaby?.id })}
        />
        <TrackingCard
          title="Estado de Ánimo"
          icon="happy-outline"
          color={colors.mood}
          onPress={() => navigation.navigate('LogMood', { babyId: selectedBaby?.id })}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Compartir Acceso"
          onPress={() => navigation.navigate('Sharing', { babyId: selectedBaby?.id })}
          variant="outline"
          icon={<Ionicons name="share-outline" size={18} color={colors.primary} />}
        />
        <Button
          title="Configurar Metas"
          onPress={() => navigation.navigate('Goals', { babyId: selectedBaby?.id })}
          variant="outline"
          icon={<Ionicons name="flag-outline" size={18} color={colors.primary} />}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  babyCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  babyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  babyAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyAvatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  babyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  babyName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  babyAge: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trackingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  actions: {
    marginBottom: spacing.lg,
  },
});
