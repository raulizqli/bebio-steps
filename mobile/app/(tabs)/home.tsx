import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useBaby } from '../../src/contexts/BabyContext';
import { feedingService } from '../../src/services/feedingService';
import { sleepService } from '../../src/services/sleepService';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { currentBaby, babies, setCurrentBaby } = useBaby();
  const [feedingStats, setFeedingStats] = useState<any>(null);
  const [sleepStats, setSleepStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentBaby) {
      loadStats();
    }
  }, [currentBaby]);

  const loadStats = async () => {
    if (!currentBaby) return;

    try {
      const [feeding, sleep] = await Promise.all([
        feedingService.getDailyStats(currentBaby._id),
        sleepService.getDailyStats(currentBaby._id),
      ]);
      setFeedingStats(feeding);
      setSleepStats(sleep);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (!currentBaby) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="baby" size={80} color="#ccc" />
        <Text style={styles.emptyText}>No baby profile yet</Text>
        <Text style={styles.emptySubtext}>Create a baby profile to get started</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.babyName}>{currentBaby.name}</Text>
        </View>
        {babies.length > 1 && (
          <TouchableOpacity style={styles.switchButton}>
            <Ionicons name="swap-horizontal" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Summary</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="nutrition" size={32} color="#FF9500" />
            <Text style={styles.statValue}>
              {feedingStats?.totalAmount || 0} oz
            </Text>
            <Text style={styles.statLabel}>Fed Today</Text>
            <Text style={styles.statSubLabel}>
              {feedingStats?.feedingCount || 0} feedings
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="moon" size={32} color="#5856D6" />
            <Text style={styles.statValue}>
              {sleepStats?.totalHours?.toFixed(1) || 0} hrs
            </Text>
            <Text style={styles.statLabel}>Slept Today</Text>
            <Text style={styles.statSubLabel}>
              {sleepStats?.sleepCount || 0} sessions
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={40} color="#007AFF" />
            <Text style={styles.actionText}>Log Feeding</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bed" size={40} color="#5856D6" />
            <Text style={styles.actionText}>Log Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="happy" size={40} color="#FF9500" />
            <Text style={styles.actionText}>Log Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="medical" size={40} color="#FF3B30" />
            <Text style={styles.actionText}>Health</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  babyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  switchButton: {
    padding: 10,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  quickActionsContainer: {
    padding: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionButton: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    color: '#000',
  },
});
