import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { useBaby } from '../../src/contexts/BabyContext';
import { sharingService, SharedAccess } from '../../src/services/sharingService';
import { Ionicons } from '@expo/vector-icons';

export default function SharingScreen() {
  const { currentBaby } = useBaby();
  const [sharedAccess, setSharedAccess] = useState<SharedAccess[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShareCode, setNewShareCode] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [permissions, setPermissions] = useState({
    canView: true,
    canEdit: false,
    canViewFeeding: true,
    canEditFeeding: false,
    canViewSleep: true,
    canEditSleep: false,
    canViewHealth: true,
    canEditHealth: false,
    canViewMood: true,
    canEditMood: false,
  });

  useEffect(() => {
    if (currentBaby) {
      loadSharedAccess();
    }
  }, [currentBaby]);

  const loadSharedAccess = async () => {
    if (!currentBaby) return;

    setIsLoading(true);
    try {
      const data = await sharingService.getSharedAccess(currentBaby._id);
      setSharedAccess(data);
    } catch (error) {
      console.error('Error loading shared access:', error);
      Alert.alert('Error', 'Failed to load shared access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShareCode = async () => {
    if (!currentBaby) return;

    try {
      const response = await sharingService.createShareCode({
        babyId: currentBaby._id,
        permissions,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      });

      setNewShareCode(response.shareCode);
      await loadSharedAccess();
    } catch (error) {
      Alert.alert('Error', 'Failed to create share code');
    }
  };

  const handleRevokeAccess = (accessId: string) => {
    Alert.alert(
      'Revoke Access',
      'Are you sure you want to revoke this access? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await sharingService.revokeAccess(accessId);
              await loadSharedAccess();
              Alert.alert('Success', 'Access revoked successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke access');
            }
          },
        },
      ]
    );
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewShareCode('');
    setExpiresInDays('');
    setPermissions({
      canView: true,
      canEdit: false,
      canViewFeeding: true,
      canEditFeeding: false,
      canViewSleep: true,
      canEditSleep: false,
      canViewHealth: true,
      canEditHealth: false,
      canViewMood: true,
      canEditMood: false,
    });
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
        <Text style={styles.title}>Share Access</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#007AFF" />
          <Text style={styles.createButtonText}>Create Share Code</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {sharedAccess.map((access) => (
          <View key={access._id} style={styles.accessCard}>
            <View style={styles.accessHeader}>
              <View>
                <Text style={styles.shareCode}>{access.shareCode}</Text>
                <Text style={styles.accessStatus}>
                  {access.isActive ? 'Active' : 'Revoked'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.revokeButton}
                onPress={() => handleRevokeAccess(access._id)}
                disabled={!access.isActive}
              >
                <Ionicons
                  name="close-circle"
                  size={32}
                  color={access.isActive ? '#FF3B30' : '#CCC'}
                />
              </TouchableOpacity>
            </View>

            {access.expiresAt && (
              <Text style={styles.expiryText}>
                Expires: {new Date(access.expiresAt).toLocaleDateString()}
              </Text>
            )}

            <View style={styles.permissionsContainer}>
              <Text style={styles.permissionsTitle}>Permissions:</Text>
              <View style={styles.permissionsList}>
                {Object.entries(access.permissions).map(([key, value]) => (
                  value && (
                    <View key={key} style={styles.permissionChip}>
                      <Text style={styles.permissionText}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                  )
                ))}
              </View>
            </View>
          </View>
        ))}

        {sharedAccess.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="share-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No shared access yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create a share code to give others access
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Share Code</Text>
              <TouchableOpacity onPress={closeCreateModal}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>

            {newShareCode ? (
              <View style={styles.shareCodeDisplay}>
                <Text style={styles.shareCodeLabel}>Your Share Code:</Text>
                <Text style={styles.shareCodeValue}>{newShareCode}</Text>
                <Text style={styles.shareCodeInstructions}>
                  Share this code with the person you want to give access to.
                  They can use it in the app to access your baby's data.
                </Text>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={closeCreateModal}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.sectionLabel}>Expiry (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Days until expiration (leave empty for no expiry)"
                  value={expiresInDays}
                  onChangeText={setExpiresInDays}
                  keyboardType="number-pad"
                />

                <Text style={styles.sectionLabel}>Permissions</Text>

                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Can View Data</Text>
                  <Switch
                    value={permissions.canView}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canView: value })
                    }
                  />
                </View>

                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Can Edit Data</Text>
                  <Switch
                    value={permissions.canEdit}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canEdit: value })
                    }
                  />
                </View>

                <Text style={styles.subsectionLabel}>Feeding</Text>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>View Feeding</Text>
                  <Switch
                    value={permissions.canViewFeeding}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canViewFeeding: value })
                    }
                  />
                </View>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Edit Feeding</Text>
                  <Switch
                    value={permissions.canEditFeeding}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canEditFeeding: value })
                    }
                  />
                </View>

                <Text style={styles.subsectionLabel}>Sleep</Text>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>View Sleep</Text>
                  <Switch
                    value={permissions.canViewSleep}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canViewSleep: value })
                    }
                  />
                </View>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Edit Sleep</Text>
                  <Switch
                    value={permissions.canEditSleep}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canEditSleep: value })
                    }
                  />
                </View>

                <Text style={styles.subsectionLabel}>Health</Text>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>View Health</Text>
                  <Switch
                    value={permissions.canViewHealth}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canViewHealth: value })
                    }
                  />
                </View>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Edit Health</Text>
                  <Switch
                    value={permissions.canEditHealth}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canEditHealth: value })
                    }
                  />
                </View>

                <Text style={styles.subsectionLabel}>Mood</Text>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>View Mood</Text>
                  <Switch
                    value={permissions.canViewMood}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canViewMood: value })
                    }
                  />
                </View>
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>Edit Mood</Text>
                  <Switch
                    value={permissions.canEditMood}
                    onValueChange={(value) =>
                      setPermissions({ ...permissions, canEditMood: value })
                    }
                  />
                </View>

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleCreateShareCode}
                >
                  <Text style={styles.generateButtonText}>
                    Generate Share Code
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  list: {
    flex: 1,
    padding: 15,
  },
  accessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  accessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  shareCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 2,
  },
  accessStatus: {
    fontSize: 14,
    color: '#34C759',
    marginTop: 5,
  },
  revokeButton: {
    padding: 5,
  },
  expiryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  permissionsContainer: {
    marginTop: 10,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  permissionText: {
    fontSize: 12,
    color: '#007AFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalScroll: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 15,
    marginBottom: 10,
  },
  subsectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  permissionLabel: {
    fontSize: 16,
    color: '#000',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareCodeDisplay: {
    padding: 20,
    alignItems: 'center',
  },
  shareCodeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  shareCodeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    letterSpacing: 4,
    marginBottom: 20,
  },
  shareCodeInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
