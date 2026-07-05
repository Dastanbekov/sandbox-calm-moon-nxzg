import { api } from './auth.service';
import { Resume, PaginatedResponse } from '@/types';

export interface ResumeFilters {
  query?: string;
  city_id?: number | string;
  scope_id?: number | string;
  busyness_id?: number | string;
  page?: number;
}

export const resumesService = {
  async getResumes(filters: ResumeFilters = {}): Promise<PaginatedResponse<Resume>> {
    const response = await api.get<PaginatedResponse<Resume>>('/api/resumes/', {
      params: filters
    });
    return response.data;
  },

  async getResume(id: number): Promise<Resume> {
    const response = await api.get<Resume>(`/api/resumes/${id}/`);
    return response.data;
  },

  async createResume(data: Partial<Resume>): Promise<Resume> {
    const response = await api.post<Resume>('/api/resumes/create/', data);
    return response.data;
  },

  async updateResume(id: number, data: Partial<Resume>): Promise<Resume> {
    const response = await api.put<Resume>(`/api/resumes/${id}/`, data);
    return response.data;
  },

  async deleteResume(id: number): Promise<void> {
    await api.delete(`/api/resumes/${id}/`);
  },

  async getCabinetResumes(page?: number): Promise<PaginatedResponse<Resume>> {
    const response = await api.get<PaginatedResponse<Resume>>('/api/resumes/cabinet/', {
      params: { page }
    });
    return response.data;
  },

  async purchaseContacts(id: number): Promise<{ detail: string; resume: Resume }> {
    const response = await api.post<{ detail: string; resume: Resume }>(`/api/resumes/${id}/buy/`);
    return response.data;
  },

  async toggleBookmark(id: number): Promise<{ status: 'saved' | 'removed' }> {
    const response = await api.post<{ status: 'saved' | 'removed' }>(`/api/resumes/${id}/bookmark/`);
    return response.data;
  },

  async complain(id: number, reasonId: number, description?: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>(`/api/resumes/${id}/complain/`, {
      reason_id: reasonId,
      description
    });
    return response.data;
  }
};
