'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/auth.service';
import ResumeForm from '@/components/forms/ResumeForm';
import { Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResumeEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [resumeData, setResumeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const res = await api.get(`/api/resumes/${id}/`);
        const data = res.data;
        
        // Transform data from backend to match form structure
        const formattedData = {
          ...data,
          city: data.city?.id ? String(data.city.id) : '',
          work_city: data.work_city?.id ? String(data.work_city.id) : '',
          busyness: data.busyness ? String(data.busyness) : '',
          driver_license: data.driver_license ? 'true' : 'false',
          has_car: data.has_car ? 'true' : 'false',
        };
        
        setResumeData(formattedData);
      } catch (error) {
        console.error('Failed to fetch resume:', error);
        toast.error('Не удалось загрузить данные резюме');
        router.push('/cabinet/resumes');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchResume();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!resumeData) {
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {resumeData.is_ai_translated && (
        <div className="max-w-[1000px] mx-auto pt-6 px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="text-blue-600 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">Сгенерировано ИИ</h3>
              <p className="text-sm text-blue-800 mt-1">
                Это резюме было переведено с помощью искусственного интеллекта. Пожалуйста, внимательно проверьте все данные, текст о себе и обязанности перед отправкой отклика. Вы можете внести любые необходимые правки ниже.
              </p>
            </div>
          </div>
        </div>
      )}
      <ResumeForm initialData={resumeData} resumeId={id} />
    </div>
  );
}
