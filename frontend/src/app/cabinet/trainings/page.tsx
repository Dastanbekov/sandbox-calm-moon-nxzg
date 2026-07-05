'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { BookOpen, Plus, MapPin, Clock } from 'lucide-react';

export default function EmployerTrainingsPage() {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.company) {
      api.get('/api/trainings/my/')
        .then(res => setTrainings(res.data.results || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (!user || !user.company) return null;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-slate-900">Мои тренинги</h1>
          <Link href="/trainings/create" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/30 transition-all">
            <Plus size={20} /> Добавить тренинг
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : trainings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <BookOpen className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">У вас пока нет тренингов</h3>
            <p className="text-slate-500 mb-6">Добавленные здесь тренинги будут размещены в общем каталоге.</p>
            <Link href="/trainings/create" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors">
              Создать первый тренинг
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {trainings.map((item: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <Link href={`/trainings/${item.id}`} className="text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors mb-2 block">
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    {item.city && <span className="flex items-center gap-1"><MapPin size={14}/> {item.city}</span>}
                    <span className="flex items-center gap-1"><Clock size={14}/> Добавлено: {new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Link href={`/trainings/${item.id}/edit`} className="text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors font-medium text-sm">
                    Редактировать
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
