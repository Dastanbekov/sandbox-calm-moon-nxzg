'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/auth.service';
import VacancyForm from '@/components/forms/VacancyForm';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VacancyEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [vacancyData, setVacancyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const res = await api.get(`/api/vacancies/${id}/`);
        const data = res.data;
        
        // Transform data from backend to match form structure
        const formattedData = {
          ...data,
          scope_id: data.scope?.id ? String(data.scope.id) : '',
          city_id: data.city?.id ? String(data.city.id) : '',
          education_id: data.education?.id ? String(data.education.id) : '',
          busyness_id: data.busyness?.id ? String(data.busyness.id) : '',
          currency: data.currency?.id ? String(data.currency.id) : '',
          
          key_skills: data.key_skills || [],
          digital_skills: data.digital_skills || [],
          vacancy_languages: data.vacancy_languages || [],
          bonuses: data.bonuses || {
            additional_payments: [],
            social_package: [],
            compensations: []
          },
        };
        
        setVacancyData(formattedData);
      } catch (error) {
        console.error('Failed to fetch vacancy:', error);
        toast.error('Не удалось загрузить данные вакансии');
        router.push('/cabinet/vacancies');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchVacancy();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!vacancyData) {
    return null;
  }

  return <VacancyForm initialData={vacancyData} vacancyId={id} />;
}
