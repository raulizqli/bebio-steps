import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import * as sharingApi from '../../src/api/sharing';
import type { FamilyMember, SharingCode } from '../../src/types';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';

export default function FamilyScreen() {
  const { currentFamily, user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [codes, setCodes] = useState<SharingCode[]>([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [newCodeRole, setNewCodeRole] = useState<'nanny' | 'family'>('nanny');
  const [newCodeHours, setNewCodeHours] = useState('24');
  const [newAccessHours, setNewAccessHours] = useState('8');

  const loadData = useCallback(async () => {
    if (!currentFamily) return;
    try {
      const [membersData, codesData] = await Promise.all([
        sharingApi.getFamilyMembers(currentFamily.id),
        sharingApi.getActiveCodes(currentFamily.id).catch(() => []),
      ]);
      setMembers(membersData);
      setCodes(codesData);
    } catch (error) {
      console.error('Failed to load family data:', error);
    }
  }, [currentFamily]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleCreateCode = async () => {
    if (!currentFamily) return;
    try {
      const permissions = newCodeRole === 'nanny' ? ['read', 'write'] : ['read'];
      const result = await sharingApi.createSharingCode({
        family_id: currentFamily.id,
        role: newCodeRole,
        permissions,
        expires_in_hours: parseInt(newCodeHours) || 24,
        access_duration_hours: newCodeRole === 'nanny' ? parseInt(newAccessHours) || 8 : undefined,
      });

      Alert.alert(
        'Código Creado',
        `Código: ${result.code}\n\nComparte este código para que se unan a tu familia.`,
        [
          { text: 'Copiar', onPress: () => Share.share({ message: `Únete a mi familia en BebIO Steps con el código: ${result.code}` }) },
          { text: 'OK' }
        ]
      );
      setShowCreateCode(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo crear el código');
    }
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    try {
      const result = await sharingApi.redeemCode(redeemCode.trim());
      Alert.alert('Unido', `Te has unido a la familia como ${result.role}`);
      setRedeemCode('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Código inválido');
    }
  };

  const handleRevokeMember = (member: FamilyMember) => {
    if (!currentFamily) return;
    Alert.alert(
      'Revocar Acceso',
      `¿Estás seguro de revocar el acceso de ${member.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingApi.revokeMemberAccess(currentFamily.id, member.id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'No se pudo revocar');
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent': return 'Padre/Madre';
      case 'nanny': return 'Niñera';
      case 'family': return 'Familiar';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent': return Colors.primary;
      case 'nanny': return Colors.secondary;
      case 'family': return Colors.accent;
      default: return Colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <Text style={styles.header}>Familia</Text>
      <Text style={styles.subheader}>{currentFamily?.name || 'Sin familia'}</Text>

      {/* Redeem Code */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unirse con código</Text>
        <View style={styles.redeemContainer}>
          <TextInput
            style={styles.codeInput}
            value={redeemCode}
            onChangeText={setRedeemCode}
            placeholder="Ingresa código"
            placeholderTextColor={Colors.textLight}
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeemCode}>
            <Text style={styles.redeemBtnText}>Unirse</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Members */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Miembros ({members.length})</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreateCode(!showCreateCode)}
          >
            <Ionicons name="person-add" size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>Invitar</Text>
          </TouchableOpacity>
        </View>

        {/* Create Code Form */}
        {showCreateCode && (
          <View style={styles.createCodeForm}>
            <Text style={styles.formLabel}>Rol:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleOption, newCodeRole === 'nanny' && styles.roleOptionActive]}
                onPress={() => setNewCodeRole('nanny')}
              >
                <Text style={[styles.roleOptionText, newCodeRole === 'nanny' && styles.roleOptionTextActive]}>
                  Niñera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, newCodeRole === 'family' && styles.roleOptionActive]}
                onPress={() => setNewCodeRole('family')}
              >
                <Text style={[styles.roleOptionText, newCodeRole === 'family' && styles.roleOptionTextActive]}>
                  Familiar
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Código válido por (horas):</Text>
            <TextInput
              style={styles.formInput}
              value={newCodeHours}
              onChangeText={setNewCodeHours}
              keyboardType="number-pad"
              placeholder="24"
            />

            {newCodeRole === 'nanny' && (
              <>
                <Text style={styles.formLabel}>Acceso limitado a (horas):</Text>
                <TextInput
                  style={styles.formInput}
                  value={newAccessHours}
                  onChangeText={setNewAccessHours}
                  keyboardType="number-pad"
                  placeholder="8"
                />
                <Text style={styles.formHint}>
                  La niñera solo podrá ver la información durante este tiempo
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.createCodeBtn} onPress={handleCreateCode}>
              <Text style={styles.createCodeBtnText}>Generar Código</Text>
            </TouchableOpacity>
          </View>
        )}

        {members.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberAvatar}>
              <Ionicons name="person" size={20} color={getRoleColor(member.role)} />
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.memberMeta}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                  <Text style={[styles.roleBadgeText, { color: getRoleColor(member.role) }]}>
                    {getRoleLabel(member.role)}
                  </Text>
                </View>
                {member.expires_at && (
                  <Text style={styles.expiresText}>
                    Expira: {new Date(member.expires_at).toLocaleDateString('es-MX')}
                  </Text>
                )}
              </View>
            </View>
            {member.role !== 'parent' && member.is_active && (
              <TouchableOpacity
                style={styles.revokeBtn}
                onPress={() => handleRevokeMember(member)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            )}
            {!member.is_active && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactivo</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Active Codes */}
      {codes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Códigos activos</Text>
          {codes.map((code) => (
            <View key={code.id} style={styles.codeCard}>
              <View style={styles.codeInfo}>
                <Text style={styles.codeValue}>{code.code}</Text>
                <Text style={styles.codeRole}>{getRoleLabel(code.role)}</Text>
                <Text style={styles.codeExpiry}>
                  Expira: {new Date(code.expires_at).toLocaleString('es-MX')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Share.share({ message: `Únete a mi familia en BebIO Steps: ${code.code}` })}
              >
                <Ionicons name="share-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
  header: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xl,
  },
  subheader: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  redeemContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  codeInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.text,
    textAlign: 'center',
  },
  redeemBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  createCodeForm: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formHint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  roleOptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  roleOptionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  createCodeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  createCodeBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  expiresText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  revokeBtn: {
    padding: Spacing.xs,
  },
  inactiveBadge: {
    backgroundColor: Colors.error + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  inactiveText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  codeInfo: {
    flex: 1,
  },
  codeValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  codeRole: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  codeExpiry: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
});
