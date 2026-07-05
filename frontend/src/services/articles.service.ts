import { api } from './auth.service';
import { PaginatedResponse } from '@/types';

export interface Article {
  id: number;
  title: string;
  body?: string;
  image?: string | null;
  url?: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export const articlesService = {
  async getArticles(page?: number): Promise<PaginatedResponse<Article>> {
    const response = await api.get<PaginatedResponse<Article>>('/api/articles/', { params: { page } });
    return response.data;
  },

  async getArticle(id: number): Promise<Article> {
    const response = await api.get<Article>(`/api/articles/${id}/`);
    return response.data;
  },

  async getRelatedArticles(count = 8): Promise<Article[]> {
    const response = await api.get<PaginatedResponse<Article>>('/api/articles/', { params: { page_size: count } });
    return response.data.results || [];
  },
};
