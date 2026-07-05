'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/auth.service';
import { lookupsService } from '@/services/lookups.service';
import { Lookups } from '@/types';

export default function SubscribesPage() {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      lookupsService.getLookups(),
      api.get('/api/auth/subscriptions/')
    ])
      .then(([lookupsData, subRes]) => {
        setLookups(lookupsData);
        setSelectedScopes(subRes.data.scope_ids || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = (id: number) => {
    setSelectedScopes(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess('');
    try {
      await api.post('/api/auth/subscriptions/', { scope_ids: selectedScopes });
      setSuccess('Подписки успешно обновлены.');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Подписка на вакансии</h2>
      </div>

      <div className="flow-root">
        <p className="text-slate-600 text-[15px] leading-relaxed">
          Выберите сферы деятельности, по которым вы хотите получать новые вакансии на ваш email:
        </p>
        
        {success && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4452c9]"></div>
            <span className="ml-3 text-slate-500 text-sm font-medium">Загрузка...</span>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {lookups?.scopes.map(scope => (
                <div key={scope.id}>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200/80 bg-white hover:border-[#4452c9]/40 hover:bg-slate-50/55 cursor-pointer transition-all select-none">
                    <input 
                      type="checkbox" 
                      checked={selectedScopes.includes(scope.id)}
                      onChange={() => handleToggle(scope.id)}
                      className="w-4 h-4 text-[#4452c9] border-slate-300 rounded focus:ring-[#4452c9] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{scope.title}</span>
                  </label>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              disabled={isSaving} 
              className="mt-8 bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-[15px] flex items-center justify-center cursor-pointer min-w-[200px]"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить подписки'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
