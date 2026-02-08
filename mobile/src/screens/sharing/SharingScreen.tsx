import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { RootStackParamList, BabyCaregiver } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { api } from '../../services/api';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Sharing'>;

const roleLabels: Record<string, string> = {
  parent: 'Padre/Madre',
  nanny: 'Niñera',
  family: 'Familiar',
};

export const SharingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { babyId } = route.params;
  const [caregivers, setCaregivers] = useState<BabyCaregiver[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<'nanny' | 'family'>('nanny');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [loading, setLoading] = useState(false);
  const [acceptCode, setAcceptCode] = useState('');

  useEffect(() => {
    loadCaregivers();
  }, []);

  const loadCaregivers = async () => {
    try {
      const data = await api.getCaregivers(babyId);
      setCaregivers(data);
    } catch (error) {
      console.log('Error loading caregivers:', error);
    }
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiresInDays || '7'));

      const result = await api.createInvite({
        babyId,
        role: selectedRole,
        accessExpiresAt: selectedRole === 'nanny' ? expirationDate.toISOString() : undefined,
        codeExpiresInHours: 48,
      });
      setInviteCode(result.code);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el código');
    }
    setLoading(false);
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copiado', 'El código ha sido copiado al portapapeles');
  };

  const handleAcceptInvite = async () => {
    if (!acceptCode) return;
    try {
      await api.acceptInvite(acceptCode);
      Alert.alert('Listo', 'Invitación aceptada correctamente');
      setAcceptCode('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Código inválido');
    }
  };

  const handleRevokeAccess = async (userId: string, userName: string) => {
    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de revocar el acceso de ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.revokeAccess(babyId, userId);
              Alert.alert('Listo', 'Acceso revocado');
              loadCaregivers();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo revocar');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Compartir Acceso</Text>

      {/* Create Invite Section */}
      <Card>
        <Text style={styles.sectionTitle}>Crear Código de Invitación</Text>

        <Text style={styles.label}>Rol</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, selectedRole === 'nanny' && styles.roleBtnActive]}
            onPress={() => setSelectedRole('nanny')}
          >
            <Text style={styles.roleEmoji}>👩‍👧</Text>
            <Text style={[styles.roleLabel, selectedRole === 'nanny' && styles.roleLabelActive]}>
              Niñera
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, selectedRole === 'family' && styles.roleBtnActive]}
            onPress={() => setSelectedRole('family')}
          >
            <Text style={styles.roleEmoji}>👨‍👩‍👦</Text>
            <Text style={[styles.roleLabel, selectedRole === 'family' && styles.roleLabelActive]}>
              Familiar
            </Text>
          </TouchableOpacity>
        </View>

        {selectedRole === 'nanny' && (
          <Input
            label="Acceso por (días)"
            value={expiresInDays}
            onChangeText={setExpiresInDays}
            placeholder="7"
            keyboardType="numeric"
          />
        )}

        <Button
          title="Generar Código"
          onPress={handleCreateInvite}
          loading={loading}
        />

        {inviteCode && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Código de invitación:</Text>
            <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode}>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.codeHint}>
              Comparte este código con la persona. Expira en 48 horas.
            </Text>
          </View>
        )}
      </Card>

      {/* Accept Invite Section */}
      <Card>
        <Text style={styles.sectionTitle}>Aceptar Invitación</Text>
        <Input
          label="Código de invitación"
          value={acceptCode}
          onChangeText={setAcceptCode}
          placeholder="Ingresa el código"
        />
        <Button
          title="Aceptar Invitación"
          onPress={handleAcceptInvite}
          variant="outline"
          disabled={!acceptCode}
        />
      </Card>

      {/* Caregivers List */}
      <Text style={styles.sectionTitle}>Personas con Acceso</Text>
      {caregivers.map((cg) => (
        <Card key={cg.id} variant="outlined">
          <View style={styles.caregiverRow}>
            <View style={styles.caregiverInfo}>
              <Text style={styles.caregiverName}>
                {cg.user?.firstName} {cg.user?.lastName}
              </Text>
              <Text style={styles.caregiverRole}>{roleLabels[cg.role] || cg.role}</Text>
              {cg.expiresAt && (
                <Text style={styles.caregiverExpiry}>
                  Acceso hasta: {new Date(cg.expiresAt).toLocaleDateString('es-MX')}
                </Text>
              )}
              <Text style={[styles.caregiverStatus, !cg.isActive && styles.inactive]}>
                {cg.isActive ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
            {cg.role !== 'parent' && cg.isActive && (
              <TouchableOpacity
                onPress={() =>
                  handleRevokeAccess(
                    cg.userId,
                    `${cg.user?.firstName} ${cg.user?.lastName}`,
                  )
                }
              >
                <Ionicons name="close-circle" size={28} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleBtn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleEmoji: { fontSize: 28, marginBottom: spacing.xs },
  roleLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  roleLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  codeContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 3,
  },
  codeHint: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caregiverInfo: { flex: 1 },
  caregiverName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  caregiverRole: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  caregiverExpiry: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: 2,
  },
  caregiverStatus: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },
  inactive: { color: colors.error },
});
