'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import { 
  ArrowLeft, 
  Eye, 
  Users, 
  Sparkles, 
  Bot, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { Vacancy } from '@/types';

type ResponseStatus = 'new' | 'reviewed' | 'invited' | 'rejected' | 'hired';

interface ResponseType {
  id: number;
  status: string;
  vacancy: number | { id: number }; // Depending on API serialization
  resume_detail?: {
    id: number;
    position: string;
    salary?: number;
    wages?: number;
    photo?: string;
    profile?: {
      name: string;
      sname: string;
      photo?: string;
    }
  };
  created_at: string;
}

interface AiCandidate {
  id: number;
  name: string;
  position: string;
  match_score: number;
  resume_id: number;
}

const BOARD_COLUMNS = [
  { id: 'new', title: 'Новые', color: 'border-blue-200 bg-blue-50/40', headerColor: 'text-blue-700 bg-blue-100/80' },
  { id: 'reviewed', title: 'Рассмотренные', color: 'border-yellow-200 bg-yellow-50/40', headerColor: 'text-yellow-700 bg-yellow-100/80' },
  { id: 'invited', title: 'Интервью', color: 'border-purple-200 bg-purple-50/40', headerColor: 'text-purple-700 bg-purple-100/80' },
  { id: 'hired', title: 'Нанят', color: 'border-green-200 bg-green-50/40', headerColor: 'text-green-700 bg-green-100/80' },
  { id: 'rejected', title: 'Отказ', color: 'border-red-200 bg-red-50/40', headerColor: 'text-red-700 bg-red-100/80' }
] as const;

type ColumnId = typeof BOARD_COLUMNS[number]['id'];

const getNextStatus = (current: string): ColumnId | null => {
  if (current === 'new' || current === 'pending' || !current) return 'reviewed';
  if (current === 'reviewed') return 'invited';
  if (current === 'invited') return 'hired';
  return null;
}

const getPrevStatus = (current: string): ColumnId | null => {
  if (current === 'reviewed') return 'new';
  if (current === 'invited') return 'reviewed';
  if (current === 'hired') return 'invited';
  if (current === 'rejected') return 'new';
  return null;
}

export default function VacancyControlPanel() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params.id as string;

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [responses, setResponses] = useState<ResponseType[]>([]);
  const [aiCandidates, setAiCandidates] = useState<AiCandidate[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const vacRes = await api.get<Vacancy>(`/api/vacancies/${id}/`);
        setVacancy(vacRes.data);

        const respRes = await api.get('/api/vacancies/responses/');
        const allResponses = Array.isArray(respRes.data) ? respRes.data : respRes.data.results || [];
        
        const filtered = allResponses.filter((r: any) => {
          const vacId = typeof r.vacancy === 'object' ? r.vacancy?.id : r.vacancy;
          return String(vacId) === String(id);
        });
        
        setResponses(filtered);
      } catch (error) {
        console.error('Error fetching vacancy data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const fetchAiCandidates = async () => {
    try {
      setIsAiLoading(true);
      const aiRes = await api.get(`/api/vacancies/${id}/ai-candidates/`);
      setAiCandidates(Array.isArray(aiRes.data) ? aiRes.data : aiRes.data.results || []);
    } catch (error) {
      console.error('Error fetching AI candidates:', error);
      alert('Ошибка при поиске AI-кандидатов');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResponseAction = async (respId: number, status: string) => {
    try {
      setActionLoadingId(respId);
      await api.patch(`/api/vacancies/responses/${respId}/status/`, { status });
      
      setResponses(prev => 
        prev.map(r => r.id === respId ? { ...r, status } : r)
      );
    } catch (error) {
      console.error(`Error updating response to ${status}:`, error);
      alert('Ошибка при изменении статуса');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="container mx-auto p-6 text-center text-gray-500">
        <p>Вакансия не найдена.</p>
        <Link href="/cabinet/vacancies" className="text-blue-600 hover:underline mt-4 inline-block">Вернуться назад</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Breadcrumb */}
        <div className="mb-6">
          <Link href="/cabinet/vacancies" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Назад к моим вакансиям
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{vacancy.position}</h1>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="flex items-center"><Eye className="w-4 h-4 mr-2" /> {vacancy.count_view || 0} просмотров</span>
                <span className="flex items-center"><Users className="w-4 h-4 mr-2" /> {responses.length} откликов</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link 
                href={`/vacancies/${id}/edit`}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Редактировать
              </Link>
            </div>
          </div>
        </div>

        {/* AI Candidates Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-start mb-4 md:mb-0">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Умный поиск кандидатов</h2>
                <p className="text-sm text-gray-600">Система найдет наиболее подходящих специалистов из базы с помощью ИИ.</p>
              </div>
            </div>
            <button 
              onClick={fetchAiCandidates}
              disabled={isAiLoading}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              {isAiLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Найти AI-кандидатов
            </button>
          </div>

          {aiCandidates.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700">Найдено подходящих кандидатов: {aiCandidates.length}</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {aiCandidates.map(ai => (
                  <li key={ai.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                        {ai.name ? ai.name.charAt(0) : 'A'}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{ai.name || 'Скрытый кандидат'}</p>
                        <p className="text-sm text-gray-500">{ai.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ai.match_score}% совпадение
                      </span>
                      <Link href={`/resumes/${ai.resume_id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Смотреть резюме
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ATS Kanban Board Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-gray-400" />
              Канбан-доска откликов
            </h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
            {BOARD_COLUMNS.map(col => {
              const colResponses = responses.filter(r => {
                const status = r.status || 'new';
                if (col.id === 'new') {
                  return status === 'new' || status === 'pending';
                }
                return status === col.id;
              });

              return (
                <div 
                  key={col.id} 
                  className={`flex-shrink-0 w-80 rounded-xl border ${col.color} flex flex-col h-[calc(100vh-400px)] min-h-[400px] shadow-sm`}
                >
                  <div className={`px-4 py-3 border-b flex justify-between items-center rounded-t-xl ${col.headerColor} border-inherit`}>
                    <h3 className="font-semibold text-sm">{col.title}</h3>
                    <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full text-inherit">
                      {colResponses.length}
                    </span>
                  </div>
                  
                  <div className="p-3 overflow-y-auto flex-1 space-y-3">
                    {colResponses.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-6 border-2 border-dashed border-gray-200/50 rounded-lg mx-2 mt-2">
                        Пусто
                      </div>
                    ) : (
                      colResponses.map(resp => {
                        const resume = resp.resume_detail;
                        const profile = resume?.profile;
                        const name = profile?.name || 'Кандидат';
                        const sname = profile?.sname || '';
                        const photo = resume?.photo;
                        const position = resume?.position || 'Без должности';
                        const expectedSalary = resume?.salary || resume?.wages;
                        const currentStatus = resp.status || 'new';
                        const isActionLoading = actionLoadingId === resp.id;

                        const nextStatus = getNextStatus(currentStatus);
                        const prevStatus = getPrevStatus(currentStatus);

                        return (
                          <div key={resp.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md relative group">
                            {isActionLoading && (
                              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                            
                            <div className="flex items-start gap-3">
                              {photo ? (
                                <img src={getImageUrl(photo)} alt={name} className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                  {name.charAt(0)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <Link href={`/resumes/${resume?.id || '#'}`} className="hover:underline">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate" title={`${name} ${sname}`}>
                                    {name} {sname}
                                  </h4>
                                </Link>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5" title={position}>
                                  {position}
                                </p>
                                {expectedSalary ? (
                                   <p className="text-xs font-medium text-gray-700 mt-1">{expectedSalary} ₸</p>
                                ) : null}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <button
                                onClick={() => prevStatus && handleResponseAction(resp.id, prevStatus)}
                                disabled={!prevStatus || isActionLoading}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                                title={prevStatus ? "Предыдущий этап" : ""}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              {currentStatus !== 'rejected' ? (
                                <button
                                   onClick={() => handleResponseAction(resp.id, 'rejected')}
                                   disabled={isActionLoading}
                                   className="text-[11px] font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                >
                                  Отказать
                                </button>
                              ) : (
                                <span className="text-[11px] font-medium text-red-500 bg-red-50 px-2 py-1 rounded">Отказано</span>
                              )}

                              <button
                                onClick={() => nextStatus && handleResponseAction(resp.id, nextStatus)}
                                disabled={!nextStatus || isActionLoading}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                                title={nextStatus ? "Следующий этап" : ""}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
