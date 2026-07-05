'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { 
  Users, 
  Briefcase, 
  Wallet,
  Settings,
  Plus,
  Eye,
  TrendingUp,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function CabinetDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (user?.user_type === 'employer') {
      api.get('/api/vacancies/analytics/')
        .then(res => setStats(res.data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (!user) return null;

  const isEmployer = user.user_type === 'employer';

  if (!isEmployer) {
    return (
      <div className="p-8 animate-fadeIn max-w-[1200px] mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Добро пожаловать, {user.name}!</h1>
        <p className="text-gray-500 font-medium text-lg">Ваш личный кабинет соискателя.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/cabinet/resumes" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl w-fit mb-4"><Briefcase size={28} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Мои резюме</h3>
            <p className="text-sm text-gray-500">Управление вашими резюме и публикациями</p>
          </Link>
          <Link href="/cabinet/saved-vacancies" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl w-fit mb-4"><Eye size={28} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Избранное</h3>
            <p className="text-sm text-gray-500">Сохраненные вакансии для отклика</p>
          </Link>
          <Link href="/cabinet/responses" className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl w-fit mb-4"><MessageSquare size={28} /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Мои отклики</h3>
            <p className="text-sm text-gray-500">История откликов и приглашений</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fadeIn max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Обзор, {user.company?.title || user.name}</h1>
          <p className="text-gray-500 font-medium">Статистика и управление вашей компанией.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/vacancies/create" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2 text-sm">
            <Plus size={18} />
            Создать вакансию
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Briefcase size={24} /></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Активные вакансии</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats?.total_vacancies || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Eye size={24} /></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Просмотры (всего)</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats?.total_views || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={24} /></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Все отклики</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats?.total_responses || 0}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><MessageSquare size={24} /></div>
                {stats?.new_responses > 0 && <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg animate-pulse">Новые</span>}
              </div>
              <div className="relative z-10">
                <p className="text-sm font-medium text-gray-500 mb-1">Новые отклики</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats?.new_responses || 0}</h3>
              </div>
              {stats?.new_responses > 0 && <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-50 rounded-full opacity-50"></div>}
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Динамика откликов</h2>
                <p className="text-sm text-gray-500">Количество откликов за последние 7 дней</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-xl"><TrendingUp className="text-gray-400" size={20}/></div>
            </div>
            
            <div className="h-[300px] w-full">
              {stats?.chart_data?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#2563eb', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area type="monotone" dataKey="responses" name="Отклики" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorResponses)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Нет данных для отображения
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/cabinet/vacancies" className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={20} /></div>
                <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Мои вакансии</span>
              </div>
            </Link>

            <Link href="/cabinet/responses" className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-purple-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={20} /></div>
                <span className="font-bold text-gray-700 group-hover:text-purple-600 transition-colors">Отклики</span>
              </div>
            </Link>

            <Link href="/cabinet/settings" className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Settings size={20} /></div>
                <span className="font-bold text-gray-700 group-hover:text-orange-600 transition-colors">Настройки</span>
              </div>
            </Link>
            
            <Link href="/cabinet/billing" className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-100 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={20} /></div>
                <span className="font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">Кошелек</span>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
