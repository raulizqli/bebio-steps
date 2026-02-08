import apiClient from './client';
import type { FamilyMember, SharingCode } from '../types';

export async function createSharingCode(data: {
  family_id: string;
  role: 'nanny' | 'family';
  permissions: string[];
  expires_in_hours: number;
  access_duration_hours?: number;
  max_uses?: number;
}): Promise<{ code: string; expires_at: string }> {
  const response = await apiClient.post('/sharing/code', data);
  return response.data;
}

export async function redeemCode(code: string): Promise<{
  family_id: string;
  role: string;
  expires_at?: string;
}> {
  const response = await apiClient.post('/sharing/redeem', { code });
  return response.data;
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const response = await apiClient.get(`/sharing/family/${familyId}/members`);
  return response.data.members;
}

export async function revokeMemberAccess(familyId: string, memberId: string): Promise<void> {
  await apiClient.delete(`/sharing/family/${familyId}/members/${memberId}`);
}

export async function updateMemberPermissions(
  familyId: string,
  memberId: string,
  data: { permissions?: string[]; expires_at?: string }
): Promise<void> {
  await apiClient.patch(`/sharing/family/${familyId}/members/${memberId}`, data);
}

export async function getActiveCodes(familyId: string): Promise<SharingCode[]> {
  const response = await apiClient.get(`/sharing/family/${familyId}/codes`);
  return response.data.codes;
}

export async function deleteCode(codeId: string): Promise<void> {
  await apiClient.delete(`/sharing/codes/${codeId}`);
}
