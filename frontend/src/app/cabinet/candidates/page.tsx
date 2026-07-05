'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Star, 
  ChevronDown, 
  CheckCircle2, 
  MessageSquare,
  BookmarkPlus
} from 'lucide-react';
import { Resume } from '@/types';

export default function AICandidatesPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVacancies, setIsLoadingVacancies] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<number | 'all'>('all');

  // Load employer's real vacancies for the dropdown
  useEffect(() => {
    if (user?.user_type === 'employer') {
      api.get('/api/vacancies/cabinet/')
        .then(res => {
          const list = res.data.results || res.data || [];
          setVacancies(list.filter((v: any) => !v.draft && !v.archive));
        })
        .catch(() => setVacancies([]))
        .finally(() => setIsLoadingVacancies(false));
    } else {
      setIsLoadingVacancies(false);
    }
  }, [user]);

  // Load AI-matched candidates for selected vacancy
  useEffect(() => {
    const fetchCandidates = async () => {
      if (selectedVacancy === 'all') {
        setCandidates([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data } = await api.get(`/api/vacancies/${selectedVacancy}/ai-candidates/`);
        setCandidates(data);
      } catch (error) {
        console.error(error);
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user_type === 'employer' && selectedVacancy !== 'all') {
      fetchCandidates();
    } else {
      setCandidates([]);
      setIsLoading(false);
    }
  }, [user, selectedVacancy]);

  if (!user || user.user_type !== 'employer') return null;

  return (
    <div className="p-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">AI Умный подбор</h1>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text text-sm font-bold flex items-center gap-1">
              <Sparkles size={16} className="text-blue-600" /> Beta
            </span>
          </div>
          <p className="text-gray-500 font-medium">Кандидаты, подобранные нейросетью специально под ваши вакансии</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-bold text-gray-700">Подбор для вакансии:</span>
          <select
            value={selectedVacancy}
            onChange={(e) => setSelectedVacancy(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            disabled={isLoadingVacancies}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none font-medium min-w-[260px] disabled:opacity-60"
          >
            <option value="all">
              {isLoadingVacancies ? 'Загрузка вакансий...' : 'Выберите вакансию...'}
            </option>
            {vacancies.map((v: any) => (
              <option key={v.id} value={v.id}>{v.position}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 flex items-center gap-2">
            <Filter size={16} /> Настроить AI фильтры
          </button>
        </div>
      </div>

      {/* AI Candidates List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">ИИ анализирует базу резюме...</div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Users className="text-blue-500" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Алгоритм пока не нашел совпадений</h3>
            <p className="text-gray-500 max-w-sm">Попробуйте смягчить требования к вакансии или расширить бюджет.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {candidates.map((candidate) => (
              <div key={candidate.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col lg:flex-row gap-6 relative overflow-hidden">
                
                {/* AI Score Badge */}
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-green-100 to-green-50 px-4 py-3 rounded-bl-2xl border-b border-l border-green-100 flex items-center gap-2 shadow-sm">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    candidate.aiScore >= 90 ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 
                    candidate.aiScore >= 80 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {candidate.aiScore}%
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-800 uppercase tracking-wider">AI Совпадение</p>
                    <p className="text-xs text-green-700 leading-none mt-0.5">Очень высокое</p>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                      {candidate.photo ? (
                        <img src={candidate.profile.photo} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                          {candidate.profile?.name?.[0]}{candidate.profile?.sname?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <Link href={`/resumes/${candidate.id}`} className="text-xl font-extrabold text-blue-600 hover:text-blue-800 transition-colors">
                        {candidate.career_objective || 'Должность не указана'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-900 font-bold">{candidate.profile?.name} {candidate.profile?.sname}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-green-600 font-bold">{candidate.wages} {candidate.currency_detail?.title || 'KGS'}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 font-medium">
                        {candidate.city_detail && (
                          <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <MapPin size={14} className="text-gray-400" /> {candidate.city_detail.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                          <Briefcase size={14} className="text-gray-400" /> Опыт: более 3 лет
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600" /> 
                      Почему алгоритм предложил этого кандидата:
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {candidate.aiReasoning.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col items-center justify-center gap-3 shrink-0 lg:w-48 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0 mt-4 lg:mt-0 border-t lg:border-t-0">
                  <Link href={`/resumes/${candidate.id}`} className="w-full py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-center text-sm">
                    Открыть резюме
                  </Link>
                  <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <MessageSquare size={16} /> Написать
                  </button>
                  <button className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <BookmarkPlus size={16} /> В избранное
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
