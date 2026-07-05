import { api } from './auth.service';
import { PaginatedResponse } from '@/types';

export interface Training {
  id: number;
  title: string;
  description?: string;
  photo?: string | null;
  coordinator?: string;
  contacter?: string;
  coach?: string;
  phone?: string;
  email?: string;
  site?: string;
  address?: string;
  price?: string;
  start_date?: string;
  expires_at?: string | null;
  duration?: string;
  schedule?: string;
  place?: string;
  location?: number;
  google_map_code?: string;
  category_id?: number;
  category?: { id: number; title: string };
  user?: any;
  created_at?: string;
  updated_at?: string;
}

export interface TrainingFilters {
  location?: string;
  category_id?: number | string;
  page?: number;
}

export const trainingsService = {
  async getTrainings(filters: TrainingFilters = {}): Promise<PaginatedResponse<Training>> {
    const response = await api.get<PaginatedResponse<Training>>('/api/trainings/', { params: filters });
    return response.data;
  },

  async getTraining(id: number): Promise<Training> {
    const response = await api.get<Training>(`/api/trainings/${id}/`);
    return response.data;
  },

  async createTraining(data: Partial<Training>): Promise<Training> {
    const response = await api.post<Training>('/api/trainings/', data);
    return response.data;
  },

  async updateTraining(id: number, data: Partial<Training>): Promise<Training> {
    const response = await api.put<Training>(`/api/trainings/${id}/`, data);
    return response.data;
  },

  async deleteTraining(id: number): Promise<void> {
    await api.delete(`/api/trainings/${id}/`);
  },

  async respondToTraining(id: number, data: { name: string; email: string; phone: string; description?: string }): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>(`/api/trainings/${id}/respond/`, data);
    return response.data;
  },
};
