'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { vacanciesService } from '@/services/vacancies.service';
import { Vacancy } from '@/types';
import { Plus, Search, Filter, Briefcase, Eye, Users, Clock, CheckCircle2, TrendingUp, Edit2, Trash2, MoreVertical, Archive, FileEdit, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function EmployerVacanciesPage() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // In a real app we would call an endpoint like /api/vacancies/my/ or filter by user.company_id
    // Here we'll just mock fetching the user's vacancies
    const fetchMyVacancies = async () => {
      try {
        const response = await vacanciesService.getCabinetVacancies(statusFilter === 'all' ? undefined : statusFilter);
        // Assume these are the employer's vacancies for demo
        setVacancies(response.results || []);
      } catch (error) {
        console.error('Failed to fetch vacancies', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.user_type === 'employer') {
      fetchMyVacancies();
    }
  }, [user, statusFilter]);

  if (!user || user.user_type !== 'employer') return null;

  const renderStatus = (vacancy: any) => {
    if (vacancy.archive) {
      return (
        <span className="flex items-center gap-1 text-gray-600 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
          <Archive size={12} /> В архиве
        </span>
      );
    }
    if (vacancy.draft) {
      return (
        <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
          <FileEdit size={12} /> Черновик
        </span>
      );
    }
    if (!vacancy.moderated) {
      return (
        <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
          <Clock3 size={12} /> На модерации
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
        <CheckCircle2 size={12} /> Активна
      </span>
    );
  };

  return (
    <div className="p-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Мои вакансии</h1>
          <p className="text-gray-500 font-medium">Управление размещенными вакансиями и откликами</p>
        </div>
        <Link href="/vacancies/create" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2 text-sm w-fit">
          <Plus size={18} />
          Создать вакансию
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Поиск по названию..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Все
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Активные
            </button>
            <button 
              onClick={() => setStatusFilter('archived')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'archived' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Архив
            </button>
          </div>
          <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Vacancies Table/List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5 pl-2">Название и статус</div>
          <div className="col-span-2 text-center">Просмотры</div>
          <div className="col-span-2 text-center">Отклики</div>
          <div className="col-span-2 text-right">Опубликовано</div>
          <div className="col-span-1 text-center">Действия</div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : vacancies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">У вас пока нет вакансий</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Разместите свою первую вакансию, чтобы начать поиск подходящих кандидатов.</p>
            <Link href="/vacancies/create" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Создать вакансию
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {vacancies.map((vacancy) => (
              <div key={vacancy.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:items-center hover:bg-blue-50/30 transition-colors group">
                
                {/* Info */}
                <div className="col-span-1 md:col-span-5 pl-2">
                  <div className="flex flex-col gap-1">
                    <Link href={`/cabinet/vacancies/${vacancy.id}`} className="font-bold text-gray-900 hover:text-blue-600 text-[15px] truncate max-w-xs md:max-w-full">
                      {vacancy.position}
                    </Link>
                    <div className="flex items-center gap-3 text-xs">
                      {vacancy.city_detail && <span className="text-gray-500">{vacancy.city_detail.title}</span>}
                      {renderStatus(vacancy)}
                      {vacancy.is_hot && (
                        <span className="flex items-center gap-1 text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded">
                          <TrendingUp size={12} /> Hot
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Views - Mobile grouped, Desktop columns */}
                <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-2 md:gap-0 mt-2 md:mt-0 text-sm">
                  <span className="md:hidden text-gray-500 text-xs">Просмотры:</span>
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <Eye size={16} className="text-gray-400" /> {vacancy.count_view || 0}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex md:justify-center items-center gap-2 md:gap-0 text-sm">
                  <span className="md:hidden text-gray-500 text-xs">Отклики:</span>
                  <Link href={`/cabinet/vacancies/${vacancy.id}`} className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-1 rounded-lg">
                    <Users size={16} className="text-blue-500" /> {vacancy.count_response || 0}
                  </Link>
                </div>

                <div className="col-span-1 md:col-span-2 flex md:justify-end items-center gap-2 md:gap-0 text-sm">
                  <span className="md:hidden text-gray-500 text-xs">Дата:</span>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Clock size={14} className="text-gray-400 hidden md:block" />
                    {vacancy.created_at ? format(new Date(vacancy.created_at), 'dd MMM yyyy', { locale: ru }) : '---'}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 md:col-span-1 flex md:justify-center items-center gap-2 mt-4 md:mt-0 border-t border-gray-100 pt-3 md:border-0 md:pt-0">
                  <div className="flex items-center gap-1">
                    <Link href={`/vacancies/${vacancy.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Редактировать">
                      <Edit2 size={16} />
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="В архив">
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors hidden md:block">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <button className="md:hidden w-full py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg ml-2">Опции</button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
