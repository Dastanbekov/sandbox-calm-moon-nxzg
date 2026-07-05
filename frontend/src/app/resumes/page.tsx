'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { resumesService } from '@/services/resumes.service';
import { lookupsService } from '@/services/lookups.service';
import { useAuth } from '@/providers/AuthProvider';
import { Resume, Lookups } from '@/types';
import { Heart, Search, MapPin, Briefcase, ChevronDown, CheckCircle2, ChevronLeft, ChevronRight, User as UserIcon, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getImageUrl } from '@/lib/utils';

function ResumesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [total, setTotal] = useState(0);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city_id') || '');
  const [selectedScope, setSelectedScope] = useState(searchParams.get('scope_id') || '');
  const [selectedBusyness, setSelectedBusyness] = useState(searchParams.get('busyness_id') || '');
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('experience') || '');
  const [wagesFrom, setWagesFrom] = useState(searchParams.get('wages_from') || '');
  const [wagesTo, setWagesTo] = useState(searchParams.get('wages_to') || '');
  
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResumes = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const params: any = { page: pageNum };
      if (searchQuery) params.query = searchQuery;
      if (selectedCity) params.city_id = selectedCity;
      if (selectedScope) params.scope_id = selectedScope;
      if (selectedBusyness) params.busyness_id = selectedBusyness;
      if (selectedExperience) params.experience = selectedExperience;
      if (wagesFrom) params.wages_from = wagesFrom;
      if (wagesTo) params.wages_to = wagesTo;
      
      const response = await resumesService.getResumes(params);
      setResumes(response.results || []);
      setTotal(response.count || 0);
      setTotalPages(Math.ceil((response.count || 0) / 15));
    } catch (error) {
      console.error("Failed to load resumes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    lookupsService.getLookups().then(data => setLookups(data)).catch(() => {});
  }, []);

  useEffect(() => {
    const pageNum = Number(searchParams.get('page')) || 1;
    setPage(pageNum);
    fetchResumes(pageNum);
  }, [searchParams]);

  const handleResumeClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (user?.user_type === 'employer') {
      router.push(`/resumes/${id}`);
    } else {
      setShowAuthModal(true);
    }
  };

  const applyFilters = (updates: any = {}) => {
    const params = new URLSearchParams();
    const newQuery = updates.query !== undefined ? updates.query : searchQuery;
    const newCity = updates.city_id !== undefined ? updates.city_id : selectedCity;
    const newScope = updates.scope_id !== undefined ? updates.scope_id : selectedScope;
    const newBusyness = updates.busyness_id !== undefined ? updates.busyness_id : selectedBusyness;
    const newExp = updates.experience !== undefined ? updates.experience : selectedExperience;
    const newWFrom = updates.wages_from !== undefined ? updates.wages_from : wagesFrom;
    const newWTo = updates.wages_to !== undefined ? updates.wages_to : wagesTo;

    if (newQuery) params.set('query', newQuery);
    if (newCity) params.set('city_id', newCity);
    if (newScope) params.set('scope_id', newScope);
    if (newBusyness) params.set('busyness_id', newBusyness);
    if (newExp) params.set('experience', newExp);
    if (newWFrom) params.set('wages_from', newWFrom);
    if (newWTo) params.set('wages_to', newWTo);
    
    params.set('page', '1');
    router.push(`/resumes?${params.toString()}`);
  };

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    applyFilters();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/resumes?${params.toString()}`);
  };

  const popularTags = ['IT', 'Маркетинг', 'Продажи', 'Бухгалтерия', 'Дизайн', 'Административный персонал'];

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Резюме</span>
        </div>

        <div className="flex flex-col gap-6">
          {/* Main Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-4 text-gray-400" size={20} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border-transparent focus:border-blue-200 focus:ring-0 rounded-xl text-[15px] transition-all placeholder:text-gray-400"
                  placeholder="Должность, навыки или ключевые слова"
                />
              </div>
              <div className="w-full md:w-[240px] relative flex items-center">
                <MapPin className="absolute left-4 text-gray-400 z-10" size={20} />
                <select 
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border-transparent focus:border-blue-200 focus:ring-0 rounded-xl text-[15px] appearance-none text-gray-700 transition-all cursor-pointer"
                >
                  <option value="">Все города</option>
                  {lookups?.cities.map(city => (
                    <option key={city.id} value={city.id}>{city.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 text-gray-400 pointer-events-none" size={16} />
              </div>
              <div className="w-full md:w-[260px] relative flex items-center">
                <Briefcase className="absolute left-4 text-gray-400 z-10" size={20} />
                <select 
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 bg-gray-50/50 hover:bg-gray-50 focus:bg-white border-transparent focus:border-blue-200 focus:ring-0 rounded-xl text-[15px] appearance-none text-gray-700 transition-all cursor-pointer"
                >
                  <option value="">Все сферы деятельности</option>
                  {lookups?.scopes.map(scope => (
                    <option key={scope.id} value={scope.id}>{scope.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 text-gray-400 pointer-events-none" size={16} />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm shadow-blue-600/20 whitespace-nowrap text-[15px]"
              >
                Найти резюме
              </button>
            </form>

            <div className="px-4 py-3 border-t border-gray-50 mt-2 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">Популярные запросы:</span>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button 
                    key={tag}
                    onClick={() => applyFilters({ query: tag })}
                    className="px-3 py-1 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-700 text-sm rounded-full transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3 flex-1">
              <select 
                value={selectedBusyness}
                onChange={(e) => applyFilters({ busyness_id: e.target.value })}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                <option value="">Любая занятость</option>
                {lookups?.busynesses.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
              <select 
                value={selectedExperience}
                onChange={(e) => applyFilters({ experience: e.target.value })}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer min-w-[140px]"
              >
                <option value="">Любой опыт</option>
                <option value="Без опыта">Без опыта</option>
                <option value="От 1 года до 3 лет">От 1 года до 3 лет</option>
                <option value="От 3 до 6 лет">От 3 до 6 лет</option>
                <option value="Более 6 лет">Более 6 лет</option>
              </select>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm text-gray-500">Ожидаемая зарплата:</span>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <input 
                    type="number" 
                    placeholder="От" 
                    value={wagesFrom}
                    onChange={(e) => setWagesFrom(e.target.value)}
                    onBlur={() => applyFilters()}
                    className="w-20 border-none bg-transparent p-2 text-sm focus:ring-0 focus:outline-none"
                  />
                  <span className="text-gray-300">-</span>
                  <input 
                    type="number" 
                    placeholder="До" 
                    value={wagesTo}
                    onChange={(e) => setWagesTo(e.target.value)}
                    onBlur={() => applyFilters()}
                    className="w-20 border-none bg-transparent p-2 text-sm focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Сортировать:</span>
              <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium">
                <option value="-updated_at">По дате обновления</option>
                <option value="-created_at">По дате создания</option>
              </select>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-baseline gap-3">
              Все резюме
              <span className="text-[15px] font-medium text-gray-400">{total} резюме</span>
            </h1>
          </div>

          {/* List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-gray-500">Загрузка...</div>
            ) : resumes.length === 0 ? (
              <div className="py-20 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.
              </div>
            ) : (
              resumes.map((resume) => {
                const name = resume.name || resume.profile?.name || 'Пользователь';
                const sname = resume.sname || resume.profile?.sname || '';
                const fullName = `${name} ${sname}`.trim();
                const initials = fullName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

                return (
                  <div key={resume.id} className="group flex flex-col md:flex-row md:items-start justify-between gap-5 p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all relative">
                    
                    {/* Left Side: Photo & Info */}
                    <div className="flex gap-5 flex-1 min-w-0">
                      <div className="hidden sm:flex flex-shrink-0 w-[72px] h-[72px] rounded-lg border border-gray-100 bg-slate-50 items-center justify-center overflow-hidden">
                        {resume.photo ? (
                          <img src={getImageUrl(resume.photo)} alt={fullName} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={32} className="text-gray-300" strokeWidth={1.5} />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a 
                            href={`/resumes/${resume.id}`} 
                            onClick={(e) => handleResumeClick(e, resume.id)}
                            className="text-lg font-bold text-blue-700 hover:text-blue-800 transition-colors truncate cursor-pointer"
                          >
                            {fullName}
                          </a>
                          {/* verified checkmark could go here if applicable */}
                        </div>
                        
                        <div className="text-[15px] text-gray-900 font-medium">
                          {resume.career_objective || 'Желаемая должность не указана'}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-1">
                          {resume.scope_detail && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded uppercase tracking-wider">{resume.scope_detail.title}</span>
                          )}
                          {resume.busyness_detail && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded uppercase tracking-wider">{resume.busyness_detail.title}</span>
                          )}
                        </div>

                        <div className="text-gray-500 text-sm line-clamp-2 mt-2 pr-4">
                          {resume.about_me || resume.about || 'Описание отсутствует.'}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Meta & Salary */}
                    <div className="flex flex-col sm:items-end justify-between gap-4 md:w-[240px] flex-shrink-0">
                      <div className="flex flex-col sm:items-end gap-1.5 w-full text-sm">
                        
                        {resume.city_detail && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{resume.city_detail.title}</span>
                          </div>
                        )}
                        
                        <div className="text-gray-500">
                          <span className="hidden sm:inline">Опыт работы: </span>
                          <span className="text-gray-700 font-medium">{resume.work_experiences && resume.work_experiences.length > 0 ? 'Есть опыт' : 'Без опыта'}</span>
                        </div>

                        <div className="mt-1 flex flex-col sm:items-end">
                          <span className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Ожидаемая зарплата:</span>
                          <span className="text-[17px] font-bold text-gray-900">
                            {resume.has_contact_access 
                              ? (resume.salary ? `${resume.salary} KGS` : <span className="text-gray-400 font-medium text-base">Не указана</span>)
                              : <span className="text-gray-400 font-medium text-base">Зарплата скрыта</span>
                            }
                          </span>
                        </div>
                      </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                        <span className="text-xs text-gray-400">
                          Обновлено {resume.created_at ? formatDistanceToNow(new Date(resume.created_at), { addSuffix: true, locale: ru }) : ''}
                        </span>
                        {/* <button className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors z-20 focus:outline-none">
                          <Heart size={20} />
                        </button> */}
                      </div>
                    </div>
                    
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-500 rounded-md transition-colors"
                >
                  &larr; Назад
                </button>
                <div className="flex items-center">
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                        >
                          {p}
                        </button>
                      );
                    } else if (p === page - 3 || p === page + 3) {
                      return <span key={p} className="px-1 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:hover:text-gray-500 rounded-md transition-colors"
                >
                  Вперед &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Email Subscribe Banner */}
          <div className="mt-12 bg-white rounded-2xl border border-blue-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            <div className="flex items-center gap-5 z-10">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bell className="text-blue-600 w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Получайте новые резюме на почту</h3>
                <p className="text-sm text-gray-500">Подпишитесь и будьте в курсе свежих резюме, подходящих вам</p>
              </div>
            </div>
            <form className="w-full md:w-auto flex flex-col sm:flex-row gap-3 z-10" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Ваш email" 
                className="w-full sm:w-64 px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-colors outline-none"
                required
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm whitespace-nowrap text-sm"
              >
                Подписаться
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ResumesPage() {
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Загрузка...</div>}>
      <ResumesList />
    </Suspense>
  );
}
