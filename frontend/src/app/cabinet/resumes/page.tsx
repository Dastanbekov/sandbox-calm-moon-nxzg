'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { FileText, Plus, MapPin, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function WorkerResumesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/resumes/cabinet/');
      setResumes(response.data.results || response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_type === 'worker') {
      fetchResumes();
    }
  }, [user]);

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить это резюме? Действие необратимо.')) {
      try {
        await api.delete(`/api/resumes/${id}/`);
        setResumes(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        alert('Ошибка при удалении резюме');
        console.error(error);
      }
    }
  };

  if (!user || user.user_type !== 'worker') return null;

  return (
    <div className="p-4 md:p-8 animate-fadeIn max-w-[1200px] mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Мои резюме</h1>
          <p className="text-gray-500 font-medium">Управляйте вашими резюме для отклика на вакансии</p>
        </div>
        <Link 
          href="/resumes/create" 
          className="flex items-center gap-2 bg-[#4452c9] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#3642a8] transition-colors shadow-sm"
        >
          <Plus size={18} />
          Создать резюме
        </Link>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
          Загрузка ваших резюме...
        </div>
      ) : resumes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="text-blue-500" size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">У вас пока нет резюме</h3>
          <p className="text-gray-500 max-w-sm mb-6">Создайте свое первое резюме, чтобы откликаться на вакансии и быть видимым для работодателей.</p>
          <Link 
            href="/resumes/create" 
            className="flex items-center gap-2 bg-[#4452c9] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#3642a8] transition-colors shadow-sm"
          >
            <Plus size={18} /> Создать резюме
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <div key={resume.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Активно
                  </div>
                  <button 
                    onClick={() => handleDelete(resume.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  <Link href={`/resumes/${resume.id}`} className="hover:text-blue-600 transition-colors">
                    {resume.career_objective}
                  </Link>
                </h3>
                
                <div className="text-blue-600 font-bold mb-4">
                  {resume.salary ? `${resume.salary} ${resume.currency_detail?.title || ''}` : 'Зарплата не указана'}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {resume.city_detail && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-400" />
                      {resume.city_detail.title}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-gray-400" />
                    {resume.count_view || 0} просмотров
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
                <span>Обновлено {format(new Date(resume.updated_at), 'dd MMM yyyy', { locale: ru })}</span>
                <Link href={`/resumes/${resume.id}`} className="font-bold text-[#4452c9] hover:underline">
                  Посмотреть
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
