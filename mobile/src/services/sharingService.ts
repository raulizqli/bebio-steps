import api from '../config/api';

export interface SharedAccess {
  _id: string;
  baby: string;
  sharedBy: string;
  sharedWith?: string;
  shareCode: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canViewFeeding: boolean;
    canEditFeeding: boolean;
    canViewSleep: boolean;
    canEditSleep: boolean;
    canViewHealth: boolean;
    canEditHealth: boolean;
    canViewMood: boolean;
    canEditMood: boolean;
  };
  expiresAt?: Date;
  isActive: boolean;
}

export const sharingService = {
  async createShareCode(data: {
    babyId: string;
    permissions?: Partial<SharedAccess['permissions']>;
    expiresInDays?: number;
  }): Promise<{ shareCode: string; expiresAt?: Date; sharedAccess: SharedAccess }> {
    const response = await api.post('/sharing/create', data);
    return response.data;
  },

  async acceptShareCode(shareCode: string): Promise<any> {
    const response = await api.post('/sharing/accept', { shareCode });
    return response.data;
  },

  async getSharedAccess(babyId: string): Promise<SharedAccess[]> {
    const response = await api.get(`/sharing/baby/${babyId}`);
    return response.data.sharedAccess;
  },

  async revokeAccess(accessId: string): Promise<void> {
    await api.delete(`/sharing/${accessId}`);
  },

  async updatePermissions(
    accessId: string,
    permissions: Partial<SharedAccess['permissions']>
  ): Promise<SharedAccess> {
    const response = await api.put(`/sharing/${accessId}/permissions`, { permissions });
    return response.data.sharedAccess;
  },
};
