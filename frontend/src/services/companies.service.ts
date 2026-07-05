import { api } from './auth.service';
import { PaginatedResponse } from '@/types';

export interface Company {
  id: number;
  title: string;
  logo?: string | null;
  about_company?: string;
  site?: string;
  phone?: string;
  fio?: string;
  address?: string;
  show_phone?: boolean;
  show_fio?: boolean;
  show_site?: boolean;
  is_leading?: boolean;
  super_hr_type?: string | null;
  google_map_code?: string;
  city_detail?: { id: number; title: string };
  scope_detail?: { id: number; title: string };
  vacancy_count?: number;
  created_at?: string;
  is_verified?: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
  email?: string;
  show_email?: boolean;
}

export interface CompanyFilters {
  query?: string;
  city_id?: number | string;
  scope_id?: number | string;
  with_vacancies?: number;
  page?: number;
}

export const companiesService = {
  async getCompanies(filters: CompanyFilters = {}): Promise<PaginatedResponse<Company>> {
    const response = await api.get<PaginatedResponse<Company>>('/api/companies/', { params: filters });
    return response.data;
  },

  async getCompany(id: number): Promise<Company & { vacancies?: any[] }> {
    const response = await api.get<Company & { vacancies?: any[] }>(`/api/companies/${id}/`);
    return response.data;
  },
};
