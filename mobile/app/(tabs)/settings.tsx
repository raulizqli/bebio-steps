import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useBabyStore } from '../../src/store/babyStore';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function SettingsScreen() {
  const { user, currentFamily, logout } = useAuthStore();
  const { currentBaby, createBaby, setGoal } = useBabyStore();
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyGender, setBabyGender] = useState<'male' | 'female' | 'other'>('female');

  const [showGoals, setShowGoals] = useState(false);
  const [sleepGoal, setSleepGoal] = useState('14');
  const [feedingGoal, setFeedingGoal] = useState('24');

  const handleAddBaby = async () => {
    if (!babyName || !babyBirthDate || !currentFamily) {
      Alert.alert('Error', 'Completa nombre y fecha de nacimiento');
      return;
    }
    try {
      await createBaby({
        family_id: currentFamily.id,
        name: babyName,
        birth_date: babyBirthDate,
        gender: babyGender,
      });
      setShowAddBaby(false);
      setBabyName('');
      setBabyBirthDate('');
      Alert.alert('Listo', `${babyName} ha sido agregado`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo agregar');
    }
  };

  const handleSaveGoals = async () => {
    if (!currentBaby) {
      Alert.alert('Error', 'Selecciona un bebé primero');
      return;
    }
    try {
      await setGoal(currentBaby.id, 'sleep_hours', parseFloat(sleepGoal) || 14);
      await setGoal(currentBaby.id, 'feeding_oz', parseFloat(feedingGoal) || 24);
      Alert.alert('Guardado', 'Metas actualizadas');
      setShowGoals(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron guardar');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Ajustes</Text>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Baby Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bebés</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowAddBaby(!showAddBaby)}
        >
          <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
          <Text style={styles.menuItemText}>Agregar bebé</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        {showAddBaby && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              value={babyName}
              onChangeText={setBabyName}
              placeholder="Nombre del bebé"
              placeholderTextColor={Colors.textLight}
            />
            <TextInput
              style={styles.input}
              value={babyBirthDate}
              onChangeText={setBabyBirthDate}
              placeholder="Fecha de nacimiento (YYYY-MM-DD)"
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.genderSelector}>
              {(['female', 'male', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderOption, babyGender === g && styles.genderOptionActive]}
                  onPress={() => setBabyGender(g)}
                >
                  <Text style={[styles.genderText, babyGender === g && styles.genderTextActive]}>
                    {g === 'female' ? 'Niña' : g === 'male' ? 'Niño' : 'Otro'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddBaby}>
              <Text style={styles.saveBtnText}>Agregar Bebé</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metas Diarias</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowGoals(!showGoals)}
        >
          <Ionicons name="flag-outline" size={22} color={Colors.accent} />
          <Text style={styles.menuItemText}>Configurar metas</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        {showGoals && (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Meta de sueño (horas/día)</Text>
            <TextInput
              style={styles.input}
              value={sleepGoal}
              onChangeText={setSleepGoal}
              keyboardType="decimal-pad"
              placeholder="14"
            />
            <Text style={styles.formLabel}>Meta de alimentación (oz/día)</Text>
            <TextInput
              style={styles.input}
              value={feedingGoal}
              onChangeText={setFeedingGoal}
              keyboardType="decimal-pad"
              placeholder="24"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoals}>
              <Text style={styles.saveBtnText}>Guardar Metas</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color={Colors.warning} />
          <Text style={styles.menuItemText}>Alertas de metas</Text>
          <View style={[styles.toggle, styles.toggleActive]}>
            <View style={[styles.toggleDot, styles.toggleDotActive]} />
          </View>
        </View>
        <View style={styles.menuItem}>
          <Ionicons name="time-outline" size={22} color={Colors.info} />
          <Text style={styles.menuItemText}>Recordatorios</Text>
          <View style={[styles.toggle, styles.toggleActive]}>
            <View style={[styles.toggleDot, styles.toggleDotActive]} />
          </View>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de</Text>
        <View style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={22} color={Colors.textSecondary} />
          <Text style={styles.menuItemText}>Versión 1.0.0</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
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
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: 2,
    gap: Spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  genderOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  genderOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  genderText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Colors.primary + '30',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textLight,
  },
  toggleDotActive: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '10',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  logoutText: {
    color: Colors.error,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
