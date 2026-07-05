'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trainingsService, Training } from '@/services/trainings.service';
import { useAuth } from '@/providers/AuthProvider';

function TrainingDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [training, setTraining] = useState<Training | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const data = await trainingsService.getTraining(Number(id));
        setTraining(data);
      } catch (error) {
        console.error("Error fetching training details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchTraining();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 font-medium bg-white px-6 py-4 rounded-2xl shadow-xs border border-slate-100">
          <svg className="animate-spin h-5 w-5 text-[#4452c9]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center bg-white px-8 py-10 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Тренинг не найден</h2>
          <p className="text-slate-500 mb-6 text-sm">Запрошенный тренинг не существует или был удален.</p>
          <Link 
            href="/trainings"
            className="inline-flex items-center justify-center bg-[#4452c9] hover:bg-[#3642a8] text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm text-sm"
          >
            К списку тренингов
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/trainings"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#4452c9] transition-colors gap-2"
          >
            <img src="/img/png/arrwoback.png" alt="" className="w-4 h-4 object-contain" />
            <span>К списку тренингов</span>
          </Link>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-6">
                {training.title}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Image Wrapper */}
                <div className="md:col-span-4 w-full">
                  <div className="relative w-full aspect-video md:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                    {training.photo ? (
                      <img src={training.photo} alt={training.title} className="w-full h-full object-cover" />
                    ) : (
                      <img src="/img/png/logo.png" alt="No Photo" className="w-full h-full object-cover opacity-60 p-6" />
                    )}
                  </div>
                </div>

                {/* Metadata Column */}
                <div className="md:col-span-8 space-y-3">
                  <div className="divide-y divide-slate-100">
                    <div className="flex flex-col sm:flex-row py-3 sm:justify-between items-start">
                      <span className="text-sm font-semibold text-slate-400 sm:w-1/3">Дата начала:</span>
                      <span className="text-sm font-medium text-slate-800 sm:w-2/3 mt-0.5 sm:mt-0">{training.start_date || 'Не указана'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-3 sm:justify-between items-start">
                      <span className="text-sm font-semibold text-slate-400 sm:w-1/3">Дата окончания:</span>
                      <span className="text-sm font-medium text-slate-800 sm:w-2/3 mt-0.5 sm:mt-0">{training.expires_at || 'Не указана'}</span>
                    </div>
                    {training.address && (
                      <div className="flex flex-col sm:flex-row py-3 sm:justify-between items-start">
                        <span className="text-sm font-semibold text-slate-400 sm:w-1/3">Адрес проведения:</span>
                        <span className="text-sm font-medium text-slate-800 sm:w-2/3 mt-0.5 sm:mt-0">{training.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end border-t border-slate-100 pt-6 mt-6">
                <a 
                  className="inline-flex items-center justify-center bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-[15px] gap-2 cursor-pointer w-full sm:w-auto" 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert('Отклик на тренинг в разработке'); }}
                >
                  <img src="/img/social/report.png" alt="" className="w-4 h-4 object-contain filter invert brightness-200" />
                  <span>Откликнуться на тренинг</span>
                </a>
              </div>
            </div>

            {/* Print block */}
            <div className="flex justify-end py-1">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); window.print(); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <img src="/img/button/print.png" alt="" className="w-3.5 h-3.5 object-contain" />
                <span>Распечатать</span>
              </a>
            </div>
            
            {/* Description Block */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Описание тренинга
              </h3>
              <div 
                className="prose max-w-none text-slate-600 leading-relaxed text-[15px]" 
                dangerouslySetInnerHTML={{ __html: training.description || 'Описание отсутствует' }} 
              />
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-3 hidden lg:block">
            {/* Banner/Sidebar placeholder */}
          </div>
        </div>
      </div>
    </div>
  );
}

import { use } from 'react';

export default function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
      <TrainingDetailContent id={id} />
    </Suspense>
  );
}
