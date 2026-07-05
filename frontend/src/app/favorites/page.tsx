'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Heart, Search, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { api } from '@/services/auth.service';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isEmployer = user?.user_type === 'employer';
  const isWorker = user?.user_type === 'worker';

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        if (isEmployer) {
          // fetch saved resumes
          const { data } = await api.get('/api/resumes/bookmarks/');
          setItems(data.results || []);
        } else {
          // fetch saved vacancies
          const { data } = await api.get('/api/vacancies/bookmarks/');
          setItems(data.results || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
        // Fallback for demo
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user, isEmployer]);

  const removeBookmark = async (id: number) => {
    try {
      if (isEmployer) {
        await api.post(`/api/resumes/${id}/bookmark/`);
      } else {
        await api.post(`/api/vacancies/${id}/bookmark/`);
      }
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      // Optimistic update for demo
      setItems(items.filter(item => item.id !== id));
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-50">
        <Heart size={64} className="text-gray-300 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Избранное</h1>
        <p className="text-gray-500 mb-6 text-center max-w-md">Войдите в систему, чтобы сохранять интересные {isEmployer ? 'резюме' : 'вакансии'} и быстро к ним возвращаться.</p>
        <Link href="/auth/login" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          Войти в аккаунт
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Избранные {isEmployer ? 'резюме' : 'вакансии'}
          </h1>
          <p className="text-gray-500 font-medium">
            {items.length} {items.length === 1 ? 'сохранено' : 'сохранено'}
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-100 shadow-sm">
            Загрузка...
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm text-center px-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Heart size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">В избранном пока пусто</h3>
            <p className="text-gray-500 mb-8 max-w-md">
              Нажимайте на иконку сердечка на {isEmployer ? 'резюме' : 'вакансиях'}, которые вам понравились, чтобы не потерять их.
            </p>
            <Link 
              href={isEmployer ? "/resumes" : "/vacancies"} 
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Search size={18} />
              Найти {isEmployer ? 'резюме' : 'вакансии'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                
                <div className="flex-1 min-w-0">
                  {isWorker ? (
                    // Vacancy Card
                    <>
                      <Link href={`/vacancies/${item.id}`} className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors block truncate mb-1">
                        {item.position}
                      </Link>
                      <p className="text-gray-900 font-medium mb-3">{item.company?.title || 'Компания'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {item.wages_from && (
                          <span className="font-bold text-green-600">от {item.wages_from} {item.currency_detail?.title || 'KGS'}</span>
                        )}
                        {item.city_detail && (
                          <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {item.city_detail.title}</span>
                        )}
                        {item.busyness_detail && (
                          <span className="flex items-center gap-1"><Briefcase size={14} className="text-gray-400" /> {item.busyness_detail.title}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    // Resume Card
                    <>
                      <Link href={`/resumes/${item.id}`} className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors block truncate mb-1">
                        {item.profile?.name} {item.profile?.sname}
                      </Link>
                      <p className="text-gray-900 font-medium mb-3">{item.career_objective || 'Должность не указана'}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {item.wages && (
                          <span className="font-bold text-green-600">{item.wages} KGS</span>
                        )}
                        {item.city_detail && (
                          <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {item.city_detail.title}</span>
                        )}
                        <span className="flex items-center gap-1"><Briefcase size={14} className="text-gray-400" /> Опыт: {item.work_experiences?.length ? 'Есть' : 'Нет'}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4 border-t sm:border-0 border-gray-100 pt-4 sm:pt-0">
                  <span className="text-xs text-gray-400">
                    Сохранено {formatDistanceToNow(new Date(), { addSuffix: true, locale: ru })}
                  </span>
                  <div className="flex gap-2">
                    <Link 
                      href={isWorker ? `/vacancies/${item.id}` : `/resumes/${item.id}`} 
                      className="px-4 py-2 bg-blue-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Открыть
                    </Link>
                    <button 
                      onClick={() => removeBookmark(item.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group/btn relative"
                      title="Удалить из избранного"
                    >
                      <Heart size={20} className="fill-current" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </div>
                    </button>
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
