'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { 
  Users, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Clock,
  MessageSquare,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ResponsesPage() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Employer Kanban state
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [draggedResponseId, setDraggedResponseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchResponses = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/vacancies/responses/');
        setResponses(response.data);
        
        // If employer and has responses, set first vacancy as selected by default
        if (user?.user_type === 'employer' && response.data.length > 0) {
          const firstVacancyId = response.data[0].vacancy_id;
          setSelectedVacancyId(firstVacancyId);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchResponses();
    }
  }, [user]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/api/vacancies/responses/${id}/status/`, { status: newStatus });
      setResponses(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast.success('Статус успешно изменен');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при изменении статуса. Проверьте права доступа.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><Clock size={12} /> Новый</span>;
      case 'reviewed':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Рассмотрен</span>;
      case 'invited':
      case 'interviewed':
      case 'hired':
        return <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12} /> {status === 'hired' ? 'Нанят' : 'Приглашен'}</span>;
      case 'rejected':
        return <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Отказ</span>;
      default:
        return null;
    }
  };

  if (!user) return null;

  const isEmployer = user.user_type === 'employer';

  // ========== WORKER VIEW ==========
  if (!isEmployer) {
    const groupedResponses = responses.reduce((acc, response) => {
      const groupKey = response.resume.career_objective;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(response);
      return acc;
    }, {} as Record<string, any[]>);

    return (
      <div className="p-4 md:p-8 animate-fadeIn max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Мои отклики</h1>
          <p className="text-gray-500 font-medium">История ваших откликов на вакансии работодателей</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">Загрузка откликов...</div>
        ) : Object.keys(groupedResponses).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Users className="text-blue-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Откликов пока нет</h3>
            <p className="text-gray-500 max-w-sm">Вы еще не откликались на вакансии. Найдите подходящую работу и отправьте резюме!</p>
            <Link href="/" className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Найти вакансию
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {(Object.entries(groupedResponses) as [string, any[]][]).map(([groupTitle, items]) => (
              <div key={groupTitle} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">{groupTitle}</h2>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                    Отправлено: {items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((response: any) => (
                    <div key={response.id} className="p-6 hover:bg-gray-50/50 transition-colors flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100">
                          <Briefcase size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link href={`/vacancies/${response.vacancy_id}`} className="text-lg font-bold text-blue-600 hover:text-blue-800 transition-colors">
                              {response.vacancy?.position || response.vacancy_title}
                            </Link>
                            {getStatusBadge(response.status)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-2">
                            <span className="text-gray-600">{response.vacancy?.company || 'Компания не указана'}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                              <Clock size={12} className="text-gray-400" /> Отклик: {format(new Date(response.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========== EMPLOYER KANBAN VIEW ==========
  
  // Extract unique vacancies
  const employerVacancies = Array.from(new Set(responses.map(r => r.vacancy_id)))
    .map(id => {
      const resp = responses.find(r => r.vacancy_id === id);
      return {
        id,
        title: resp.vacancy_title,
        count: responses.filter(r => r.vacancy_id === id).length
      };
    });

  // Filter responses by selected vacancy
  const currentResponses = responses.filter(r => r.vacancy_id === selectedVacancyId);

  // Group by Kanban columns
  const kanbanColumns = [
    { id: 'new', title: 'Новые', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { id: 'reviewed', title: 'Рассмотрены', color: 'bg-gray-100 border-gray-200 text-gray-800' },
    { id: 'interviewed', title: 'Интервью', color: 'bg-purple-50 border-purple-200 text-purple-800', extraStatuses: ['invited'] },
    { id: 'hired', title: 'Оффер', color: 'bg-green-50 border-green-200 text-green-800' },
    { id: 'rejected', title: 'Отказ', color: 'bg-red-50 border-red-200 text-red-800' },
  ];

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedResponseId(id);
    // Required for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedResponseId === null) return;
    
    const response = responses.find(r => r.id === draggedResponseId);
    if (!response) return;

    // Check if status is actually changing (and handle 'invited' -> 'interviewed' mapping if needed)
    const currentCanonicalStatus = response.status === 'invited' ? 'interviewed' : response.status;
    if (currentCanonicalStatus !== targetStatus) {
      updateStatus(draggedResponseId, targetStatus);
    }
    
    setDraggedResponseId(null);
  };

  return (
    <div className="p-4 md:p-8 animate-fadeIn max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Отклики (ATS)</h1>
          <p className="text-gray-500 font-medium">Канбан-доска для управления кандидатами</p>
        </div>

        {employerVacancies.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl px-4 py-3 pr-10 shadow-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[250px]"
              value={selectedVacancyId || ''}
              onChange={(e) => setSelectedVacancyId(Number(e.target.value))}
            >
              {employerVacancies.map(vac => (
                <option key={vac.id} value={vac.id}>
                  {vac.title} ({vac.count})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">Загрузка доски...</div>
      ) : employerVacancies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Users className="text-blue-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Откликов пока нет</h3>
          <p className="text-gray-500 max-w-sm">Как только кандидаты начнут откликаться на ваши вакансии, здесь появится удобная канбан-доска.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-8 items-start">
          {kanbanColumns.map(col => {
            const colResponses = currentResponses.filter(r => 
              r.status === col.id || (col.extraStatuses && col.extraStatuses.includes(r.status))
            );

            return (
              <div 
                key={col.id} 
                className={`flex-shrink-0 w-[300px] flex flex-col max-h-[80vh] rounded-2xl bg-gray-50/50 border border-gray-200/60 shadow-sm`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={`p-3 border-b border-gray-200/60 rounded-t-2xl ${col.color} border-x-0 border-t-0 flex items-center justify-between`}>
                  <h3 className="font-bold text-sm tracking-wide uppercase">{col.title}</h3>
                  <span className="bg-white/60 px-2 py-0.5 rounded-md text-xs font-black">{colResponses.length}</span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                  {colResponses.map(r => (
                    <div 
                      key={r.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, r.id)}
                      className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Link href={`/resumes/${r.resume.id}`} className="font-bold text-gray-900 leading-tight hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                          {r.resume.career_objective}
                        </Link>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-200">
                          {r.resume.profile?.name?.[0]}{r.resume.profile?.sname?.[0] || ''}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800 leading-none mb-1">
                            {r.resume.profile?.name} {r.resume.profile?.sname || ''}
                          </span>
                          <span className="text-xs font-bold text-green-600 leading-none">
                            {r.resume.salary ? `${r.resume.salary} KGS` : 'По договоренности'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(r.created_at), 'dd.MM, HH:mm')}
                        </span>
                        {r.resume.city_detail && (
                          <span className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                            <MapPin size={10} /> {r.resume.city_detail.title}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {colResponses.length === 0 && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4">
                      <span className="text-gray-400 text-sm font-medium text-center">Перетащите карточку сюда</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
