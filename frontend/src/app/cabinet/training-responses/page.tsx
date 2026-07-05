'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';

export default function TrainingResponsesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/api/trainings/responses/')
        .then(res => setData(res.data.results || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Заявки на тренинги</h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <BookOpen className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Заявок пока нет</h3>
            <p className="text-slate-500 mb-6">Вы еще не подавали заявки на участие в тренингах.</p>
            <Link href="/trainings" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
              Смотреть курсы
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {data.map((item: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <Link href={`/trainings/${item.training_id}`} className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors mb-2 block">
                    {item.training?.title || 'Тренинг'}
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={14}/> Дата заявки: {new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <CheckCircle2 size={14}/> Заявка принята
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
