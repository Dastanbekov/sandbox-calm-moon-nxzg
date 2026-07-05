'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/services/auth.service';

export default function SavedVacanciesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await api.get('/api/vacancies/bookmarks/');
      setItems(res.data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (confirm('Удалить из сохраненных?')) {
      try {
        await api.post(`/api/vacancies/${id}/bookmark/`);
        fetchItems();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="border-b border-slate-100 pb-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Сохраненные вакансии</h2>
      </div>

      <div className="flow-root">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4452c9]"></div>
            <span className="ml-3 text-slate-500 text-sm font-medium">Загрузка...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">У вас нет сохраненных вакансий.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((vacancy: any) => (
              <div className="py-5 first:pt-0 last:pb-0" key={vacancy.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Link 
                      href={`/vacancies/${vacancy.id}`} 
                      className="text-[17px] font-semibold text-slate-900 hover:text-[#4452c9] transition-all block truncate"
                    >
                      {vacancy.position}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <span>{vacancy.company_title}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-start sm:self-center">
                    <a 
                      href="#" 
                      onClick={(e) => handleRemove(e, vacancy.id)} 
                      className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 rounded-xl transition-all cursor-pointer"
                    >
                      Удалить
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
