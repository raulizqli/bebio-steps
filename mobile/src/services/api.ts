import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired - redirect to login
          SecureStore.deleteItemAsync('accessToken');
        }
        return Promise.reject(error);
      },
    );
  }

  // =================== Auth ===================
  async register(data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) {
    const response = await this.client.post('/auth/register', data);
    await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('accessToken', response.data.accessToken);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  async logout() {
    await SecureStore.deleteItemAsync('accessToken');
  }

  // =================== Babies ===================
  async createBaby(data: any) {
    const response = await this.client.post('/babies', data);
    return response.data;
  }

  async getBabies() {
    const response = await this.client.get('/babies');
    return response.data;
  }

  async getBaby(babyId: string) {
    const response = await this.client.get(`/babies/${babyId}`);
    return response.data;
  }

  async updateBaby(babyId: string, data: any) {
    const response = await this.client.put(`/babies/${babyId}`, data);
    return response.data;
  }

  async setGoals(babyId: string, data: any) {
    const response = await this.client.post(`/babies/${babyId}/goals`, data);
    return response.data;
  }

  async getGoals(babyId: string) {
    const response = await this.client.get(`/babies/${babyId}/goals`);
    return response.data;
  }

  async getCaregivers(babyId: string) {
    const response = await this.client.get(`/babies/${babyId}/caregivers`);
    return response.data;
  }

  async revokeAccess(babyId: string, targetUserId: string) {
    const response = await this.client.post(`/babies/${babyId}/revoke-access/${targetUserId}`);
    return response.data;
  }

  // =================== Sharing ===================
  async createInvite(data: any) {
    const response = await this.client.post('/sharing/invite', data);
    return response.data;
  }

  async acceptInvite(code: string) {
    const response = await this.client.post('/sharing/accept', { code });
    return response.data;
  }

  async getInvites(babyId: string) {
    const response = await this.client.get(`/sharing/invites/${babyId}`);
    return response.data;
  }

  // =================== Feedings ===================
  async logFeeding(data: any) {
    const response = await this.client.post('/feedings', data);
    return response.data;
  }

  async getFeedings(babyId: string, date?: string) {
    const params = date ? { date } : {};
    const response = await this.client.get(`/feedings/baby/${babyId}`, { params });
    return response.data;
  }

  async getFeedingSummary(babyId: string, date: string) {
    const response = await this.client.get(`/feedings/baby/${babyId}/summary`, { params: { date } });
    return response.data;
  }

  // =================== Sleep ===================
  async logSleep(data: any) {
    const response = await this.client.post('/sleep', data);
    return response.data;
  }

  async getSleepLogs(babyId: string, date?: string) {
    const params = date ? { date } : {};
    const response = await this.client.get(`/sleep/baby/${babyId}`, { params });
    return response.data;
  }

  async getSleepSummary(babyId: string, date: string) {
    const response = await this.client.get(`/sleep/baby/${babyId}/summary`, { params: { date } });
    return response.data;
  }

  // =================== Meals ===================
  async logMeal(data: any) {
    const response = await this.client.post('/meals', data);
    return response.data;
  }

  async getMeals(babyId: string, date?: string) {
    const params = date ? { date } : {};
    const response = await this.client.get(`/meals/baby/${babyId}`, { params });
    return response.data;
  }

  // =================== Symptoms ===================
  async logSymptom(data: any) {
    const response = await this.client.post('/symptoms', data);
    return response.data;
  }

  async getSymptoms(babyId: string, activeOnly = false) {
    const response = await this.client.get(`/symptoms/baby/${babyId}`, {
      params: { activeOnly },
    });
    return response.data;
  }

  // =================== Medicines ===================
  async logMedicine(data: any) {
    const response = await this.client.post('/medicines', data);
    return response.data;
  }

  async getMedicines(babyId: string) {
    const response = await this.client.get(`/medicines/baby/${babyId}`);
    return response.data;
  }

  async getActiveMedicines(babyId: string) {
    const response = await this.client.get(`/medicines/baby/${babyId}/active`);
    return response.data;
  }

  // =================== Mood ===================
  async logMood(data: any) {
    const response = await this.client.post('/mood', data);
    return response.data;
  }

  async getMoodLogs(babyId: string, date?: string) {
    const params = date ? { date } : {};
    const response = await this.client.get(`/mood/baby/${babyId}`, { params });
    return response.data;
  }

  // =================== Notifications ===================
  async getNotifications(limit = 50) {
    const response = await this.client.get('/notifications', { params: { limit } });
    return response.data;
  }

  async getUnreadCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.client.post(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.post('/notifications/read-all');
    return response.data;
  }
}

export const api = new ApiService();
