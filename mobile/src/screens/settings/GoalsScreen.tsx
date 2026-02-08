import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

export const GoalsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [sleepHours, setSleepHours] = useState('14');
  const [feedingOz, setFeedingOz] = useState('24');
  const [mealsGoal, setMealsGoal] = useState('3');
  const [notifySleep, setNotifySleep] = useState(true);
  const [notifyFeeding, setNotifyFeeding] = useState(true);
  const [notifyMeals, setNotifyMeals] = useState(false);
  const [goalCheckTime, setGoalCheckTime] = useState('20:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const goals = await api.getGoals(babyId);
      if (goals) {
        setSleepHours(goals.dailySleepHoursGoal?.toString() || '14');
        setFeedingOz(goals.dailyFeedingOzGoal?.toString() || '24');
        setMealsGoal(goals.dailyMealsGoal?.toString() || '3');
        setNotifySleep(goals.notifySleepGoal);
        setNotifyFeeding(goals.notifyFeedingGoal);
        setNotifyMeals(goals.notifyMealGoal);
        setGoalCheckTime(goals.goalCheckTime || '20:00');
      }
    } catch (error) {
      console.log('No goals set yet');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.setGoals(babyId, {
        dailySleepHoursGoal: parseFloat(sleepHours),
        dailyFeedingOzGoal: parseFloat(feedingOz),
        dailyMealsGoal: parseInt(mealsGoal),
        notifySleepGoal: notifySleep,
        notifyFeedingGoal: notifyFeeding,
        notifyMealGoal: notifyMeals,
        goalCheckTime,
      });
      Alert.alert('Listo', 'Metas actualizadas', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Metas Diarias</Text>
      <Text style={styles.subtitle}>
        Configura las metas diarias y recibe notificaciones cuando no se cumplan
      </Text>

      <Card>
        <Text style={styles.sectionTitle}>🌙 Sueño</Text>
        <Input label="Horas de sueño al día" value={sleepHours} onChangeText={setSleepHours} placeholder="14" keyboardType="numeric" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notificar si no se cumple</Text>
          <Switch value={notifySleep} onValueChange={setNotifySleep} trackColor={{ true: colors.primary }} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🍼 Alimentación</Text>
        <Input label="Onzas al día" value={feedingOz} onChangeText={setFeedingOz} placeholder="24" keyboardType="numeric" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notificar si no se cumple</Text>
          <Switch value={notifyFeeding} onValueChange={setNotifyFeeding} trackColor={{ true: colors.primary }} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>🍽️ Comidas</Text>
        <Input label="Comidas al día" value={mealsGoal} onChangeText={setMealsGoal} placeholder="3" keyboardType="numeric" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Notificar si no se cumple</Text>
          <Switch value={notifyMeals} onValueChange={setNotifyMeals} trackColor={{ true: colors.primary }} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>⏰ Hora de revisión</Text>
        <Input label="Hora para verificar metas (HH:mm)" value={goalCheckTime} onChangeText={setGoalCheckTime} placeholder="20:00" />
      </Card>

      <Button title="Guardar Metas" onPress={handleSave} loading={loading} size="large" style={styles.saveButton} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  switchLabel: { fontSize: fontSize.md, color: colors.text },
  saveButton: { marginTop: spacing.md },
});
