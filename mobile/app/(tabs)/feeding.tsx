import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useBaby } from '../../src/contexts/BabyContext';
import { feedingService, Feeding } from '../../src/services/feedingService';
import { Ionicons } from '@expo/vector-icons';

export default function FeedingScreen() {
  const { currentBaby } = useBaby();
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentBaby) {
      loadFeedings();
    }
  }, [currentBaby]);

  const loadFeedings = async () => {
    if (!currentBaby) return;

    setIsLoading(true);
    try {
      const { feedings: data } = await feedingService.getFeedings(currentBaby._id, {
        limit: 20,
      });
      setFeedings(data);
    } catch (error) {
      console.error('Error loading feedings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const feedDate = new Date(date);

    if (feedDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (feedDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return feedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!currentBaby) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No baby selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#007AFF" />
          <Text style={styles.addButtonText}>Log Feeding</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {feedings.map((feeding) => (
          <View key={feeding._id} style={styles.feedingCard}>
            <View style={styles.feedingHeader}>
              <View style={styles.feedingTypeContainer}>
                <Ionicons
                  name={
                    feeding.type === 'breast'
                      ? 'woman'
                      : feeding.type === 'bottle'
                      ? 'flask'
                      : 'restaurant'
                  }
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.feedingType}>
                  {feeding.type.charAt(0).toUpperCase() + feeding.type.slice(1)}
                </Text>
              </View>
              <Text style={styles.feedingTime}>
                {formatTime(feeding.startTime)}
              </Text>
            </View>

            <View style={styles.feedingDetails}>
              {feeding.amount && (
                <Text style={styles.feedingAmount}>
                  {feeding.amount} {feeding.unit}
                </Text>
              )}
              {feeding.side && (
                <Text style={styles.feedingSide}>
                  {feeding.side.charAt(0).toUpperCase() + feeding.side.slice(1)} side
                </Text>
              )}
              {feeding.duration && (
                <Text style={styles.feedingDuration}>
                  {feeding.duration} min
                </Text>
              )}
            </View>

            {feeding.notes && (
              <Text style={styles.feedingNotes}>{feeding.notes}</Text>
            )}

            <Text style={styles.feedingDate}>
              {formatDate(feeding.startTime)}
            </Text>
          </View>
        ))}

        {feedings.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="nutrition-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No feedings recorded yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button above to log your first feeding
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  list: {
    flex: 1,
    padding: 15,
  },
  feedingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  feedingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedingType: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#000',
  },
  feedingTime: {
    fontSize: 16,
    color: '#666',
  },
  feedingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 8,
  },
  feedingAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  feedingSide: {
    fontSize: 14,
    color: '#666',
  },
  feedingDuration: {
    fontSize: 14,
    color: '#666',
  },
  feedingNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  feedingDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
