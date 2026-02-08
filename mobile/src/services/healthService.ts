import api from '../config/api';

export interface Symptom {
  _id: string;
  baby: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
  startTime: Date;
  endTime?: Date;
}

export interface Disease {
  _id: string;
  baby: string;
  name: string;
  diagnosedDate: Date;
  diagnosedBy?: string;
  status: 'active' | 'recovered' | 'chronic';
  description?: string;
  symptoms: string[];
  medications: string[];
  notes?: string;
}

export interface Medication {
  _id: string;
  baby: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  purpose?: string;
  sideEffects?: string[];
  isActive: boolean;
  administrations: {
    time: Date;
    administeredBy: string;
    notes?: string;
  }[];
}

export const healthService = {
  async createSymptom(data: Partial<Symptom>): Promise<Symptom> {
    const response = await api.post('/health/symptoms', data);
    return response.data.symptom;
  },

  async getSymptoms(babyId: string): Promise<Symptom[]> {
    const response = await api.get(`/health/symptoms/${babyId}`);
    return response.data.symptoms;
  },

  async createDisease(data: Partial<Disease>): Promise<Disease> {
    const response = await api.post('/health/diseases', data);
    return response.data.disease;
  },

  async getDiseases(babyId: string): Promise<Disease[]> {
    const response = await api.get(`/health/diseases/${babyId}`);
    return response.data.diseases;
  },

  async createMedication(data: Partial<Medication>): Promise<Medication> {
    const response = await api.post('/health/medications', data);
    return response.data.medication;
  },

  async getMedications(babyId: string, isActive?: boolean): Promise<Medication[]> {
    const response = await api.get(`/health/medications/${babyId}`, {
      params: { isActive },
    });
    return response.data.medications;
  },

  async addMedicationAdministration(
    medicationId: string,
    data: { time?: Date; notes?: string }
  ): Promise<Medication> {
    const response = await api.post(
      `/health/medications/${medicationId}/administration`,
      data
    );
    return response.data.medication;
  },

  async updateMedication(medicationId: string, data: Partial<Medication>): Promise<Medication> {
    const response = await api.put(`/health/medications/${medicationId}`, data);
    return response.data.medication;
  },
};
