import { api } from './auth.service';
import { Vacancy, VacancyResponse, PaginatedResponse } from '@/types';

export interface VacancyFilters {
  query?: string;
  city_id?: number | string;
  scope_id?: number | string;
  busyness_id?: number | string;
  is_hot?: boolean;
  page?: number;
  limit?: number;
}

export const vacanciesService = {
  async getVacancies(filters: VacancyFilters = {}): Promise<PaginatedResponse<Vacancy>> {
    const response = await api.get<PaginatedResponse<Vacancy>>('/api/vacancies/', {
      params: filters
    });
    return response.data;
  },

  async getVacancy(id: number): Promise<Vacancy> {
    const response = await api.get<Vacancy>(`/api/vacancies/${id}/`);
    return response.data;
  },

  async createVacancy(data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await api.post<Vacancy>('/api/vacancies/create/', data);
    return response.data;
  },

  async updateVacancy(id: number, data: Partial<Vacancy>): Promise<Vacancy> {
    const response = await api.put<Vacancy>(`/api/vacancies/${id}/`, data);
    return response.data;
  },

  async deleteVacancy(id: number): Promise<void> {
    await api.delete(`/api/vacancies/${id}/`);
  },

  async getCabinetVacancies(statusTab?: string, page?: number): Promise<PaginatedResponse<Vacancy>> {
    const response = await api.get<PaginatedResponse<Vacancy>>('/api/vacancies/cabinet/', {
      params: { status_tab: statusTab, page }
    });
    return response.data;
  },

  async publishVacancy(id: number): Promise<{ detail: string; vacancy_id: number }> {
    const response = await api.post<{ detail: string; vacancy_id: number }>(`/api/vacancies/${id}/publish/`);
    return response.data;
  },

  async respondToVacancy(
    id: number,
    resumeId?: number,
    files?: { file1?: File; file2?: File; file3?: File }
  ): Promise<VacancyResponse> {
    const formData = new FormData();
    if (resumeId) {
      formData.append('resume_id', resumeId.toString());
    }
    if (files) {
      if (files.file1) formData.append('file1', files.file1);
      if (files.file2) formData.append('file2', files.file2);
      if (files.file3) formData.append('file3', files.file3);
    }

    const response = await api.post<VacancyResponse>(`/api/vacancies/${id}/respond/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async toggleBookmark(id: number): Promise<{ status: 'saved' | 'removed' }> {
    const response = await api.post<{ status: 'saved' | 'removed' }>(`/api/vacancies/${id}/bookmark/`);
    return response.data;
  },

  async complain(id: number, reasonId: number, description?: string): Promise<{ detail: string }> {
    const response = await api.post<{ detail: string }>(`/api/vacancies/${id}/complain/`, {
      reason_id: reasonId,
      description
    });
    return response.data;
  }
};
