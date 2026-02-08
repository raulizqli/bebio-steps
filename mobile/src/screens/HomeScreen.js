import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useBaby } from '../context/BabyContext';
import api from '../config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HomeScreen({ navigation }) {
  const { selectedBaby, babies, setSelectedBaby } = useBaby();
  const [feedingSummary, setFeedingSummary] = useState(null);
  const [sleepSummary, setSleepSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedBaby) {
      fetchSummaries();
    }
  }, [selectedBaby]);

  const fetchSummaries = async () => {
    if (!selectedBaby) return;

    try {
      const [feedingRes, sleepRes] = await Promise.all([
        api.get(`/feeding/${selectedBaby.id}/summary/today`),
        api.get(`/sleep/${selectedBaby.id}/summary/today`),
      ]);

      setFeedingSummary(feedingRes.data);
      setSleepSummary(sleepRes.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaries();
    setRefreshing(false);
  };

  if (!selectedBaby) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay bebés registrados</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddBaby')}
        >
          <Text style={styles.addButtonText}>Agregar Bebé</Text>
        </TouchableOpacity>
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
        <Text style={styles.babyName}>{selectedBaby.firstName}</Text>
        <Text style={styles.date}>
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
        </Text>
      </View>

      {babies.length > 1 && (
        <ScrollView horizontal style={styles.babySelector}>
          {babies.map((baby) => (
            <TouchableOpacity
              key={baby.id}
              style={[
                styles.babySelectorItem,
                baby.id === selectedBaby.id && styles.babySelectorItemActive,
              ]}
              onPress={() => setSelectedBaby(baby)}
            >
              <Text
                style={[
                  styles.babySelectorText,
                  baby.id === selectedBaby.id && styles.babySelectorTextActive,
                ]}
              >
                {baby.firstName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Alimentación Hoy</Text>
          {feedingSummary && (
            <>
              <Text style={styles.summaryValue}>
                {feedingSummary.totalOz.toFixed(1)} oz
              </Text>
              <Text style={styles.summarySubtext}>
                de {feedingSummary.goalOz} oz
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(feedingSummary.percentOfGoal, 100)}%`,
                      backgroundColor:
                        feedingSummary.percentOfGoal >= 100 ? '#34C759' : '#007AFF',
                    },
                  ]}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Sueño Hoy</Text>
          {sleepSummary && (
            <>
              <Text style={styles.summaryValue}>
                {sleepSummary.totalHours.toFixed(1)} h
              </Text>
              <Text style={styles.summarySubtext}>
                de {sleepSummary.goalHours} h
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(sleepSummary.percentOfGoal, 100)}%`,
                      backgroundColor:
                        sleepSummary.percentOfGoal >= 100 ? '#34C759' : '#007AFF',
                    },
                  ]}
                />
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Feeding')}
        >
          <Text style={styles.actionButtonText}>🍼 Registrar Alimentación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Sleep')}
        >
          <Text style={styles.actionButtonText}>😴 Registrar Sueño</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Meal')}
        >
          <Text style={styles.actionButtonText}>🍽️ Registrar Comida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Mood')}
        >
          <Text style={styles.actionButtonText}>😊 Registrar Estado de Ánimo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Illness')}
        >
          <Text style={styles.actionButtonText}>🤒 Registrar Enfermedad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Medication')}
        >
          <Text style={styles.actionButtonText}>💊 Registrar Medicamento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Share')}
        >
          <Text style={styles.actionButtonText}>👥 Compartir Acceso</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  babyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  babySelector: {
    padding: 10,
    backgroundColor: '#fff',
  },
  babySelectorItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  babySelectorItemActive: {
    backgroundColor: '#007AFF',
  },
  babySelectorText: {
    fontSize: 14,
    color: '#333',
  },
  babySelectorTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
