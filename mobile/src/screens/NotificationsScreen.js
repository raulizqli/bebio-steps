import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'No se pudieron marcar las notificaciones');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
      onPress={() => !item.isRead && handleMarkAsRead(item.id)}
      onLongPress={() =>
        Alert.alert(
          'Eliminar Notificación',
          '¿Deseas eliminar esta notificación?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: () => handleDeleteNotification(item.id),
            },
          ]
        )
      }
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <View style={styles.notificationFooter}>
        <Text style={styles.notificationBaby}>{item.baby.firstName}</Text>
        <Text style={styles.notificationTime}>
          {format(new Date(item.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Marcar todas como leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay notificaciones</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  markAllButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  unreadBanner: {
    backgroundColor: '#007AFF',
    padding: 10,
    alignItems: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  notificationCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationBaby: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});
