'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { trainingsService } from '@/services/trainings.service';
import { lookupsService } from '@/services/lookups.service';
import { Lookups } from '@/types';
import { Training } from '@/services/trainings.service';

function TrainingsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTrainings = async (pageNum = 1, append = false) => {
    try {
      const params: any = { page: pageNum };
      if (selectedCategory) params.category_id = selectedCategory;
      
      const response = await trainingsService.getTrainings(params);
      if (append) {
        setTrainings(prev => [...prev, ...(response.results || [])]);
      } else {
        setTrainings(response.results || []);
      }
      setTotal(response.count || 0);
    } catch (error) {
      console.error("Failed to load trainings:", error);
    }
  };

  useEffect(() => {
    lookupsService.getLookups().then(data => setLookups(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    fetchTrainings(1, false);
  }, [searchParams]);

  const handleCategoryClick = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    setSelectedCategory(categoryId);
    router.push(`/trainings${categoryId ? `?category_id=${categoryId}` : ''}`);
  };

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrainings(nextPage, true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {selectedCategory && (
          <div className="mb-6">
            <a 
              href="#" 
              onClick={(e) => handleCategoryClick(e, '')}
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#4452c9] transition-colors gap-2"
            >
              <img src="/img/png/arrwoback.png" alt="" className="w-4 h-4 object-contain" />
              <span>Назад</span>
            </a>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Категории тренингов
              </h2>
              <ul className="space-y-1">
                <li>
                  <a 
                    href="#" 
                    onClick={(e) => handleCategoryClick(e, '')}
                    className={`block w-full text-left px-4 py-2.5 rounded-xl text-[15px] transition-all duration-200 ${
                      !selectedCategory 
                        ? 'bg-[#4452c9]/5 text-[#4452c9] font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Все категории
                  </a>
                </li>
                {lookups?.scopes.map(scope => (
                  <li key={scope.id}>
                    <a 
                      href="#" 
                      onClick={(e) => handleCategoryClick(e, scope.id.toString())}
                      className={`block w-full text-left px-4 py-2.5 rounded-xl text-[15px] transition-all duration-200 ${
                        selectedCategory === scope.id.toString()
                          ? 'bg-[#4452c9]/5 text-[#4452c9] font-semibold' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {scope.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="lg:col-span-9">
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {trainings.map(training => (
                <li key={training.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col group">
                  <Link href={`/trainings/${training.id}`} className="flex flex-col h-full">
                    <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                      {training.photo ? (
                        <img src={training.photo} alt={training.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <img src="/img/png/logo.png" alt="No photo" className="w-full h-full object-cover opacity-60 p-6 group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-800 text-[16px] group-hover:text-[#4452c9] transition-colors line-clamp-2 mb-3 min-h-[48px] leading-snug">
                        {training.title}
                      </h3>
                      <div className="mt-auto flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"></path>
                        </svg>
                        <span>Дата начала: {training.start_date}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {trainings.length < total && (
              <div className="flex justify-center mt-10">
                <a 
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-8 border border-slate-200 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer text-sm" 
                  href="#" 
                  onClick={handleLoadMore}
                >
                  Показать еще
                </a>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default function TrainingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center items-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <svg className="animate-spin h-5 w-5 text-[#4452c9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Загрузка...</span>
        </div>
      </div>
    }>
      <TrainingsList />
    </Suspense>
  );
}
