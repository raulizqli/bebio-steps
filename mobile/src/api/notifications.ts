import apiClient from './client';
import type { Notification } from '../types';

export async function getNotifications(unreadOnly = false): Promise<{
  notifications: Notification[];
  unread_count: number;
}> {
  const params = unreadOnly ? { unread: 'true' } : {};
  const response = await apiClient.get('/notifications', { params });
  return response.data;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}

export async function registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
  await apiClient.post('/notifications/push-token', { token, platform });
}
