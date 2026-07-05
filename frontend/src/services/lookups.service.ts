import { api } from './auth.service';
import { Lookups } from '@/types';

let lookupsCache: Lookups | null = null;
let pendingPromise: Promise<Lookups> | null = null;

export const lookupsService = {
  async getLookups(): Promise<Lookups> {
    if (lookupsCache) {
      return lookupsCache;
    }

    if (pendingPromise) {
      return pendingPromise;
    }

    pendingPromise = api.get<Lookups>('/api/vacancies/lookups/')
      .then(response => {
        lookupsCache = response.data;
        pendingPromise = null;
        return lookupsCache;
      })
      .catch(error => {
        pendingPromise = null;
        throw error;
      });

    return pendingPromise;
  },

  clearCache() {
    lookupsCache = null;
  }
};
