'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { lookupsService } from '@/services/lookups.service';
import { api } from '@/services/auth.service';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { 
  Building2, GraduationCap, Clock, FileText, Check, ChevronRight, ChevronLeft, 
  MapPin, DollarSign, Plus, X, UploadCloud, Calendar, Lightbulb, Trash2, Briefcase, Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as any;

const vacancySchema = z.object({
  // Step 1
  position: z.string().min(2, 'Минимум 2 символа'),
  profession: z.string().optional(),
  scope_id: z.string().optional(),
  city_id: z.string().min(1, 'Укажите город'),
  education_id: z.string().min(1, 'Выберите образование'),
  experience: z.string().min(1, 'Укажите опыт работы'),
  
  key_skills: z.array(z.string()).min(1, 'Добавьте минимум один профессиональный навык'),
  digital_skills: z.array(z.string()).optional(),
  
  busyness_id: z.string().min(1, 'Укажите тип занятости'),
  work_format: z.string().optional(),
  work_graphite: z.string().optional(),
  
  vacancy_languages: z.array(z.object({
    language: z.string(),
    level: z.string()
  })).refine(
    langs => langs.some(l => l.level !== 'Не требуется'),
    { message: 'Выберите уровень хотя бы для одного языка' }
  ),

  salary_type: z.string(),
  wages_from: z.string().optional(),
  wages_to: z.string().optional(),
  currency: z.string().optional(),
  salary_net: z.boolean().optional(),

  bonuses: z.object({
    additional_payments: z.array(z.string()).optional(),
    social_package: z.array(z.string()).optional(),
    compensations: z.array(z.string()).optional(),
  }).optional(),

  deadline_date: z.string().optional(),
  deadline_time: z.string().optional(),

  // Step 2
  overview: z.string().optional(),
  qualification_requirements: z.string()
    .min(1, 'Укажите требования')
    .refine(val => val.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim().length >= 20, { message: 'Минимум 20 символов' }),
  duties: z.string()
    .min(1, 'Укажите обязанности')
    .refine(val => val.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim().length >= 20, { message: 'Минимум 20 символов' }),
  conditions: z.string().optional(),

  // Step 3
  email_notification_frequency: z.string().optional(),
  language: z.string().or(z.number()).optional(),
  application_languages: z.array(z.string().or(z.number())).optional(),
  application_language: z.string().optional(),
  request_type: z.string().optional(),
  link_online_form: z.string().optional(),
  form_from_file: z.any().optional(), // For file upload, handle separately if needed
}).refine(data => {
  if (data.salary_type === 'exact') {
    return !!data.wages_from && !!data.currency;
  }
  if (data.salary_type === 'range') {
    return !!data.wages_from && !!data.wages_to && !!data.currency;
  }
  return true;
}, {
  message: "Укажите сумму и валюту зарплаты",
  path: ["wages_from"]
});

type VacancyFormValues = z.infer<typeof vacancySchema>;

interface VacancyFormProps {
  initialData?: any;
  vacancyId?: string;
  postingLanguage?: string; // язык вакансии, выбранный на предыдущем шаге (en/ru/ky)
}

export default function VacancyForm({ initialData, vacancyId, postingLanguage }: VacancyFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [lookups, setLookups] = useState<any>({ 
    scopes: [], cities: [], educations: [], busynesses: [], currencies: [], languages: [], proficiencies: []
  });
  const [isLookupsLoading, setIsLookupsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [marketStats, setMarketStats] = useState<any>(null);
  
  const [skillInput, setSkillInput] = useState('');
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAddLang, setShowAddLang] = useState(false);
  const [addLangValue, setAddLangValue] = useState('');
  // Флаг: ИИ уже сгенерировал описание — повторная генерация заблокирована
  const [aiAlreadyGenerated, setAiAlreadyGenerated] = useState<boolean>(() => {
    // Если редактируем существующую вакансию (initialData) или это черновик с уже имеющимся текстом,
    // считаем описание уже готовым — не перезаписываем его
    if (initialData?.overview || initialData?.qualification_requirements || initialData?.duties) {
      return true;
    }
    return false;
  });
  // Красивый экран загрузки ИИ при переходе с шага 1 → шаг 2
  const [showAiLoadingScreen, setShowAiLoadingScreen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const defaultDeadlineDate = new Date();
  defaultDeadlineDate.setDate(defaultDeadlineDate.getDate() + 30);
  const defaultDateString = defaultDeadlineDate.toISOString().split('T')[0];

  const {
    register, control, handleSubmit, watch, setValue, trigger, getValues, formState: { errors, isDirty }
  } = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: initialData ? {
      ...initialData,
      application_language: initialData.application_languages && initialData.application_languages.length > 0 ? initialData.application_languages[0] : 'ru',
    } : {
      position: '',
      profession: '',
      scope_id: '',
      city_id: '',
      education_id: '',
      experience: 'Нет опыта',
      
      key_skills: [],
      digital_skills: [],
      
      busyness_id: '',
      work_format: 'Полная занятость',
      work_graphite: '',
      
      vacancy_languages: [],
      
      salary_type: 'exact',
      wages_from: '',
      wages_to: '',
      currency: '',
      salary_net: true,
      
      bonuses: {
        additional_payments: [],
        social_package: [],
        compensations: []
      },
      
      deadline_date: defaultDateString,
      deadline_time: '18:00',
      
      overview: '',
      qualification_requirements: '',
      duties: '',
      conditions: '',
      
      email_notification_frequency: 'every',
      language: '',
      application_languages: [],
      application_language: 'ru',
      request_type: 'employment',
      link_online_form: ''
    } as Partial<VacancyFormValues>,
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: "vacancy_languages"
  });

  useEffect(() => {
    register('key_skills');
    register('digital_skills');
    register('form_from_file');
  }, [register]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_type !== 'employer') {
        router.push('/');
      }
    }
  }, [user, isAuthLoading, router]);

  const selectedProfession = watch('profession');
  const selectedPosition = watch('position');
  const selectedCity = watch('city_id');
  
  useEffect(() => {
    // Ищем только по стандартизированной профессии (сгенерированной ИИ) и городу
    if (!selectedProfession || !selectedCity) {
      setMarketStats(null);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const query = new URLSearchParams();
        query.append('profession', selectedProfession);
        query.append('city_id', selectedCity);
        const res = await api.get(`/api/vacancies/market-stats/?${query.toString()}`);
        setMarketStats(res.data);
      } catch (err) {
        // ignore errors for analytics widget
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [selectedProfession, selectedCity]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const data = await lookupsService.getLookups();
        setLookups({
          scopes: data.scopes || [],
          cities: data.cities || [],
          busynesses: data.busynesses || [],
          currencies: data.currencies || [],
          educations: data.educations || [],
          languages: data.languages || [],
          proficiencies: data.proficiencies || [],
        });
        
      } catch (error) {
        console.error('Failed to load lookups:', error);
      } finally {
        setIsLookupsLoading(false);
      }
    };
    if (user?.user_type === 'employer') {
      fetchLookups();
    } else if (user) {
      setIsLookupsLoading(false);
    }
  }, [user]);

  const DEFAULT_LANG_TITLES = ['Кыргызский', 'Русский', 'Английский'];

  useEffect(() => {
    if (lookups.languages && lookups.languages.length > 0 && languageFields.length === 0) {
      const defaultLangs = DEFAULT_LANG_TITLES
        .map(title => lookups.languages.find((l: any) => l.title === title))
        .filter(Boolean)
        .map((l: any) => ({ language: l.title, level: 'Не требуется' }));
      if (defaultLangs.length > 0) {
        setValue('vacancy_languages', defaultLangs);
      }
    }
  }, [lookups.languages, languageFields.length, setValue]);

  const formData = watch();

  const positionValue = watch('position');
  const [lastGeneratedProf, setLastGeneratedProf] = useState('');
  const [availableKeySkills, setAvailableKeySkills] = useState<string[]>([]);

  // Защита от случайного закрытия/ухода со страницы с несохраненными данными
  useEffect(() => {
    // 1. При обновлении страницы или закрытии вкладки
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = ''; // Стандартный способ вызова окна подтверждения
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. При клике на ссылки внутри приложения (клиентский роутинг Next.js)
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty || isSubmitting) return;
      
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (!anchor) return;
      
      const targetUrl = anchor.href;
      const currentUrl = window.location.href;
      
      // Игнорируем якоря на той же странице или ссылки, открывающиеся в новом окне
      if (targetUrl && targetUrl !== currentUrl && anchor.target !== '_blank') {
        const confirmExit = window.confirm('У вас есть несохраненные данные. Вы уверены, что хотите уйти с этой страницы?');
        if (!confirmExit) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    
    // Перехватываем клик на фазе capture, до того как Next.js обработает переход
    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [isDirty, isSubmitting]);

  // AI Skills generation with debounce
  useEffect(() => {
    if (!positionValue || positionValue.length <= 2) return;

    const handler = setTimeout(async () => {
      if (positionValue !== lastGeneratedProf) {
        setLastGeneratedProf(positionValue);
        setIsGeneratingSkills(true);
        try {
          const res = await api.get(`/api/vacancies/suggest-skills/?position=${encodeURIComponent(positionValue)}`);
          const data = res.data;
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            if (data.profession) {
              setValue('profession', data.profession, { shouldValidate: true });
            }
            if (Array.isArray(data.key_skills) && data.key_skills.length > 0) {
              setAvailableKeySkills(data.key_skills);
              // Не выбираем автоматически — пользователь сам отмечает нужные
            }
            // AI-специфичные цифровые навыки (профессиональные) → в профнавыки, НЕ в цифровые
            if (Array.isArray(data.digital_skills) && data.digital_skills.length > 0) {
              setAvailableKeySkills(prev => Array.from(new Set([...prev, ...data.digital_skills])));
            }
          }
        } catch (err) {
          console.error("Error generating skills", err);
        } finally {
          setIsGeneratingSkills(false);
        }
      }
    }, 1500); // Wait 1.5 seconds after typing stops

    return () => clearTimeout(handler);
  }, [positionValue, lastGeneratedProf, formData.digital_skills, setValue]);

  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await api.post('/api/vacancies/generate-description/', {
        position: formData.position,
        profession: formData.profession,
        experience: formData.experience,
        key_skills: formData.key_skills
      });
      if (res.data) {
        if (res.data.overview) {
          setValue('overview', res.data.overview, { shouldValidate: true });
        }
        if (res.data.qualification_requirements) {
          setValue('qualification_requirements', res.data.qualification_requirements, { shouldValidate: true });
        }
        if (res.data.duties) {
          setValue('duties', res.data.duties, { shouldValidate: true });
        }
        if (res.data.conditions) {
          setValue('conditions', res.data.conditions, { shouldValidate: true });
        }
        toast.success('Описания успешно сгенерированы ИИ!');
      }
    } catch (err) {
      toast.error('Не удалось сгенерировать описания');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newSkill = skillInput.trim().replace(/,$/, '');
      if (newSkill && !formData.key_skills?.includes(newSkill)) {
        setValue('key_skills', [...(formData.key_skills || []), newSkill]);
        setAvailableKeySkills(prev => Array.from(new Set([...prev, newSkill])));
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setValue('key_skills', formData.key_skills?.filter(s => s !== skill) || []);
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['position', 'city_id', 'education_id', 'experience', 'key_skills', 'vacancy_languages', 'busyness_id'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['qualification_requirements', 'duties'];
    }

    if (currentStep === 1) {
      if (formData.salary_type !== 'none' && (!formData.wages_from || !formData.currency || (formData.salary_type === 'range' && !formData.wages_to))) {
        toast.error("Укажите зарплату и валюту, либо выберите 'Не указывать'", { duration: 5000 });
        const salaryBlock = document.getElementById('salary_block');
        if (salaryBlock) {
          salaryBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 1) {
        const hasNoDescription = !formData.overview && !formData.qualification_requirements && !formData.duties && !formData.conditions;
        if (hasNoDescription && !aiAlreadyGenerated) {
          // Показываем красивый экран ИИ-генерации
          setShowAiLoadingScreen(true);
          await handleAIGenerate();
          setAiAlreadyGenerated(true);
          setShowAiLoadingScreen(false);
        }
      }
      
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Collect error messages and show them
      const currentErrors = fieldsToValidate
        .filter(f => (errors as any)[f])
        .map(f => {
          const labels: Record<string, string> = {
            position: 'Должность',
            city_id: 'Город',
            education_id: 'Образование',
            experience: 'Опыт работы',
            key_skills: 'Профессиональные навыки',
            vacancy_languages: 'Требования к языкам',
            busyness_id: 'Тип занятости',
            qualification_requirements: 'Требования к кандидату',
            duties: 'Обязанности',
          };
          return labels[f] || f;
        });

      if (currentErrors.length > 0) {
        toast.error(`Заполните обязательные поля: ${currentErrors.join(', ')}`, { duration: 5000 });
      }

      setTimeout(() => {
        if (currentErrors.includes('Требования к языкам')) {
          const langBlock = document.getElementById('vacancy_languages_block');
          if (langBlock) {
            langBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        const firstErrorElement = document.querySelector('.text-red-500');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const firstBorderError = document.querySelector('.border-red-500, .border-red-400');
          if (firstBorderError) {
            firstBorderError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  };

  const onSubmit = async (data: VacancyFormValues) => {
    setIsSubmitting(true);
    try {
      const postingLang = postingLanguage || (initialData?.posting_language ?? 'ru');
      const payload = {
        ...data,
        posting_language: postingLang,
        application_languages: data.application_language ? [data.application_language] : [],
        salary_net: String(data.salary_net) === 'true',
        currency: data.currency ? data.currency : null,
        busyness: data.busyness_id,
        scope: data.scope_id,
        city: data.city_id,
        education: data.education_id,
        draft: false,
      };

      if (vacancyId) {
        // 1. Обновляем данные через правильный эндпоинт
        await api.put(`/api/vacancies/${vacancyId}/update/`, payload);

        // 2. Если это был черновик — отправляем на публикацию
        if (initialData?.draft) {
          await api.post(`/api/vacancies/${vacancyId}/publish/`);
          toast.success('Вакансия отправлена на модерацию!');
        } else {
          toast.success('Вакансия успешно обновлена!');
        }
        router.push(`/vacancies/${vacancyId}`);
      } else {
        // Новая вакансия — сразу публикуем
        const res = await api.post('/api/vacancies/create/', payload);
        toast.success('Вакансия успешно отправлена на модерацию!');
        router.push(`/vacancies/${res.data.id || res.data.vacancy_id || res.data.vacancy?.id}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      const msg = error?.response?.data?.detail || 'Ошибка при сохранении вакансии';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const data = getValues();
      if (!data.position || data.position.length < 2) {
        toast.error('Для сохранения черновика укажите хотя бы название должности (Должность)');
        setIsSubmitting(false);
        return;
      }

      const postingLang = postingLanguage || (initialData?.posting_language ?? 'ru');
      const payload = {
        ...data,
        posting_language: postingLang,
        salary_net: String(data.salary_net) === 'true',
        currency: data.currency ? data.currency : null,
        busyness: data.busyness_id ? data.busyness_id : null,
        scope: data.scope_id ? data.scope_id : null,
        city: data.city_id ? data.city_id : null,
        education: data.education_id ? data.education_id : null,
        draft: true,
      };

      if (vacancyId) {
        // Черновик уже существует — обновляем через правильный эндпоинт
        await api.put(`/api/vacancies/${vacancyId}/update/`, payload);
      } else {
        // Новая вакансия — создаём как черновик
        await api.post('/api/vacancies/create/', payload);
      }

      toast.success('Черновик успешно сохранён!');
      router.push('/cabinet/vacancies?tab=drafts');
    } catch (error: any) {
      console.error('Draft save error:', error);
      const msg = error?.response?.data?.detail || 'Ошибка при сохранении черновика';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted || isAuthLoading || isLookupsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (isPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
            <h1 className="text-3xl font-bold">{formData.position}</h1>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {lookups.cities.find((c: any) => c.id == formData.city_id)?.title}</span>
              <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1"/> 
                {formData.salary_type === 'exact' ? `${formData.wages_from}` : 
                 formData.salary_type === 'range' ? `${formData.wages_from} - ${formData.wages_to}` : 'Не указана'}
              </span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {lookups.busynesses.find((b: any) => b.id == formData.busyness_id)?.title || formData.busyness_id}</span>
              <span className="flex items-center"><Building2 className="w-4 h-4 mr-1"/> {formData.work_format}</span>
              <span className="flex items-center"><GraduationCap className="w-4 h-4 mr-1"/> {lookups.educations.find((e: any) => e.id == formData.education_id)?.title || 'Любое образование'}</span>
              <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1"/> Опыт: {formData.experience || 'Без опыта'}</span>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            {formData.key_skills && formData.key_skills.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Профессиональные навыки</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.key_skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Описание вакансии</h3>
              <div className="text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: formData.overview || 'Описание отсутствует' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Требования</h3>
              <div className="text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: formData.qualification_requirements || 'Не указаны' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Обязанности</h3>
              <div className="text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: formData.duties || 'Не указаны' }} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Условия</h3>
              <div className="text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: formData.conditions || 'Не указаны' }} />
            </div>
            
            <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
              <button onClick={() => setIsPreview(false)} className="px-6 py-2 border border-gray-300 rounded-lg">Вернуться к редактированию</button>
              <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Опубликовать</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative">
      {showAiLoadingScreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-all duration-300">
          <div className="flex flex-col items-center gap-5 max-w-lg w-full text-center px-6">
            {/* Spinner */}
            <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 leading-snug">
              Создаём описание вакансии<br />с помощью ИИ ✨
            </h2>
            <div className="space-y-2">
              <p className="text-gray-500 text-sm">Это займёт всего несколько секунд.</p>
              <p className="text-gray-500 text-sm">ИИ сгенерирует описание вакансии на основе ваших данных.</p>
              <p className="text-gray-500 text-sm">Вы сможете внести любые изменения и опубликовать готовый вариант.</p>
            </div>
            <p className="text-gray-400 text-sm mt-2">Пожалуйста, подождите...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{vacancyId ? 'Редактирование вакансии' : 'Новая вакансия'}</h1>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-10 transition-all duration-500" style={{ width: `${((currentStep - 1) / 2) * 100}%` }}></div>
            
            {['Требования', 'Описание', 'Способ отклика'].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${currentStep > idx + 1 ? 'bg-blue-600 text-white' : currentStep === idx + 1 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
                  {currentStep > idx + 1 ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`mt-3 text-sm font-medium ${currentStep >= idx + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
              </div>
            ))}
            <div className="flex flex-col items-center">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-white text-gray-400 border-2 border-gray-200`}>
                  <Check className="w-5 h-5" />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-400">Готово</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8 pb-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              | Разместить вакансию ({currentStep}/3)
            </h2>
          </div>

          <form>
            {/* STEP 1 */}
            <div className={`space-y-6 ${currentStep === 1 ? 'block' : 'hidden'}`}>
              <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Должность:*</label>
                  <div className="w-full">
                    <input type="text" {...register('position')} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white ${errors.position ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`} placeholder="Введите должность"/>
                    {errors.position && <p className="text-red-500 text-xs mt-1">⚠ {errors.position.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Профессия:* <span className="text-blue-600">ИИ✨</span></label>
                  <div className="w-full relative">
                    <input type="text" {...register('profession')} readOnly disabled className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-gray-100/50 text-gray-500 cursor-not-allowed border-gray-200" placeholder="Определяется автоматически при помощи ИИ"/>
                    {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession.message}</p>}
                  </div>
                </div>



                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Город:*</label>
                  <div className="w-full">
                    <select {...register('city_id')} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white ${errors.city_id ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}>
                      <option value="">Выберите город</option>
                      {lookups.cities.map((s:any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    {errors.city_id && <p className="text-red-500 text-xs mt-1">⚠ {errors.city_id.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Образование:*</label>
                  <div className="w-full space-y-2">
                    <select {...register('education_id')} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white ${errors.education_id ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}>
                      <option value="">Выберите требуемый уровень образования</option>
                      {lookups.educations.map((e:any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    {errors.education_id && <p className="text-red-500 text-xs mt-1">⚠ {errors.education_id.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Опыт работы:*</label>
                  <div className="w-full space-y-2">
                    <select {...register('experience')} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white ${errors.experience ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}>
                      <option value="">Выберите уровень опыта</option>
                      <option value="Начальный (0 - 2 года)">Начальный (0 - 2 года)</option>
                      <option value="Средний (2 - 5 лет)">Средний (2 - 5 лет)</option>
                      <option value="Опытный (5+ лет)">Опытный (5+ лет)</option>
                      <option value="Руководитель (7+ лет)">Руководитель (7+ лет)</option>
                    </select>
                    {errors.experience && <p className="text-red-500 text-xs mt-1">⚠ {errors.experience.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Профессиональные навыки:* <span className="text-blue-600">ИИ✨</span></label>
                  <div className="w-full">
                    <div className={`w-full flex flex-wrap gap-3 p-3 rounded-lg border min-h-[60px] transition-all ${errors.key_skills ? 'border-red-400 bg-red-50/30' : 'bg-blue-50/50 border-blue-100'}`}>
                      {Array.from(new Set([...(availableKeySkills || []), ...(formData.key_skills || [])])).map((skill) => {
                        const isChecked = (formData.key_skills || []).includes(skill);
                        return (
                          <label
                            key={skill}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all select-none ${
                              isChecked ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              const current = formData.key_skills || [];
                              if (isChecked) {
                                setValue('key_skills', current.filter(s => s !== skill), { shouldValidate: true });
                              } else {
                                setValue('key_skills', [...current, skill], { shouldValidate: true });
                              }
                            }}
                          >
                            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white" />}
                            </span>
                            {skill}
                          </label>
                        );
                      })}
                      <div className="flex-1 min-w-[200px] flex items-center">
                        <input 
                          type="text" 
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleAddSkill}
                          placeholder={isGeneratingSkills ? "Генерация ИИ..." : "Свой навык (Enter)..."}
                          className="w-full bg-transparent outline-none text-sm px-2 py-1"
                          disabled={isGeneratingSkills}
                        />
                      </div>
                    </div>
                    {errors.key_skills && <p className="text-red-500 text-xs mt-1">⚠ {errors.key_skills.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Цифровые навыки:</label>
                  <div className="w-full flex flex-wrap gap-3 p-3 bg-blue-50/50 rounded-lg border">
                    {[
                      'Microsoft Office', 'Работа с электронной почтой', 'Интернет и онлайн-поиск',
                      'Работа с Google Docs/Sheets', 'Онлайн-коммуникация', 'Zoom / видеоконференции',
                      'Работа с файлами и документами', 'Облачные сервисы', 'Ввод данных',
                      'Цифровая грамотность', 'AI-инструменты'
                    ].map(skill => {
                      const isChecked = (formData.digital_skills || []).includes(skill);
                      return (
                        <label
                          key={skill}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all select-none ${
                            isChecked ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            const current = formData.digital_skills || [];
                            const next = isChecked
                              ? current.filter(s => s !== skill)
                              : [...current, skill];
                            setValue('digital_skills', next);
                          }}
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isChecked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3 h-3 text-white" />}
                          </span>
                          {skill}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Занятость:*</label>
                  <div className="w-full space-y-2">
                    <select {...register('busyness_id')} className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white ${errors.busyness_id ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}>
                      <option value="">Выберите тип занятости</option>
                      {lookups.busynesses.map((b:any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                    {errors.busyness_id && <p className="text-red-500 text-xs mt-1">⚠ {errors.busyness_id.message}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Формат работы:*</label>
                  <div className="w-full flex gap-6">
                    {['в офисе', 'удаленно', 'смешанный'].map(format => (
                      <label key={format} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" value={format} {...register('work_format')} className="text-blue-600" />
                        <span>{format}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">График работы:</label>
                  <div className="w-full">
                    <input type="text" {...register('work_graphite')} placeholder="Например, с 8:30 до 17:30, перерыв на обед 12:00 - 13:00" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white"/>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-700 font-medium">Язык вакансии:*</label>
                  <div className="space-y-3">
                    {languageFields.map((field, idx) => (
                      <div key={field.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800 w-28 shrink-0">{field.language}</span>
                        <select
                          {...register(`vacancy_languages.${idx}.level` as const)}
                          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none bg-white"
                        >
                          <option value="Не требуется">Не требуется</option>
                          <option value="Базовый">Базовый — понимаю простые фразы</option>
                          <option value="Средний">Средний — могу общаться в работе</option>
                          <option value="Продвинутый">Продвинутый — уверенно работаю</option>
                          <option value="Свободный">Свободный — как родной</option>
                        </select>
                      </div>
                    ))}

                    {(errors.vacancy_languages as any)?.message && (
                      <p className="text-red-500 text-xs">⚠ {(errors.vacancy_languages as any).message}</p>
                    )}
                  </div>
                </div>

                <div id="salary_block" className="flex flex-col gap-2 pt-6 border-t">
                  <label className="text-gray-700 font-medium mt-1">Заработная плата:*</label>
                  <div className="w-full space-y-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Lightbulb className="w-4 h-4 text-blue-600"/>
                      <i>Совет: добавьте зарплату — такие вакансии получают на 60% больше откликов</i>
                    </div>
                    
                    <div className="space-y-2">
                      {['exact', 'range', 'none'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value={type} {...register('salary_type')} className="text-blue-600" />
                          <span>{type === 'exact' ? 'Точная сумма' : type === 'range' ? 'Вилка (от - до)' : 'Не указывать'}</span>
                        </label>
                      ))}
                    </div>

                    {formData.salary_type !== 'none' && (
                      <div className="bg-blue-50/50 p-4 rounded-lg flex flex-wrap gap-4 items-end">
                        {formData.salary_type === 'exact' && (
                          <div className="flex items-center gap-2">
                            <span>Сумма:*</span>
                            <input type="text" {...register('wages_from')} className={`w-32 p-2 border rounded ${errors.wages_from ? 'border-red-500' : ''}`} />
                          </div>
                        )}
                        {formData.salary_type === 'range' && (
                          <div className="flex items-center gap-2">
                            <span>От*</span>
                            <input type="text" {...register('wages_from')} className={`w-24 p-2 border rounded ${errors.wages_from ? 'border-red-500' : ''}`} />
                            <span>До*</span>
                            <input type="text" {...register('wages_to')} className="w-24 p-2 border rounded" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span>Валюта:*</span>
                          <select {...register('currency')} className={`p-2 border rounded ${errors.currency ? 'border-red-500' : 'border-gray-300'}`}>
                            <option value="" disabled>Выберите валюту</option>
                            {lookups.currencies.map((c:any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        </div>
                        
                        <div className="w-full flex gap-6 mt-2">
                          <label className="flex items-center gap-2">
                            <input type="radio" value="true" {...register('salary_net')} className="text-blue-600" /> На руки (net)
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" value="false" {...register('salary_net')} className="text-blue-600" /> До вычета налогов (gross)
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {/* Analytics Widget Real Data */}
                    {marketStats ? (
                      marketStats.total_vacancies > 0 ? (
                        <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-6">
                          <h4 className="font-bold text-gray-900 mb-4">Статистика рынка:</h4>
                          <ul className="space-y-3 text-sm text-gray-700 list-disc list-inside">
                            <li>Средняя зарплата по рынку: <span className="font-bold">{marketStats.avg_salary_from.toLocaleString()} сом</span></li>
                            <li>Минимальная отметка: {marketStats.min_salary_from.toLocaleString()} сом</li>
                            <li>Максимальная отметка: {marketStats.max_salary_from.toLocaleString()} сом</li>
                            <li>Всего конкурентных вакансий сейчас: <span className="font-bold text-blue-700">{marketStats.total_vacancies}</span></li>
                          </ul>
                          <div className="mt-6 bg-blue-600 text-white p-3 rounded-lg text-center text-sm font-medium">
                            Аналитика рынка доступна бесплатно в период бета-тестирования.
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                          <p className="text-sm text-gray-500">Для данной должности в выбранном городе пока нет опубликованных вакансий, чтобы рассчитать среднюю зарплату по рынку.</p>
                        </div>
                      )
                    ) : (
                      <div className="border border-gray-200 bg-gray-50 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
                        <p className="text-sm text-gray-500">Укажите название должности и город, чтобы увидеть статистику зарплат по рынку.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-6">
                  <label className="text-gray-700 font-medium">Бонусы и условия, которые вы предлагаете:</label>
                  <div className="w-full grid grid-cols-3 gap-4">
                    <div className="border rounded-2xl border-blue-300 p-4">
                      <h5 className="text-sm font-bold mb-3 h-10">Дополнительные выплаты и бонусы</h5>
                      <div className="space-y-2 text-xs">
                        {['13-я зарплата', 'Годовой бонус', 'Бонусы по результатам (KPI)', 'Комиссия / % от продаж', 'Разовая премия'].map(i => (
                          <label key={i} className="flex items-center gap-2"><input type="checkbox" value={i} {...register('bonuses.additional_payments')} /> {i}</label>
                        ))}
                      </div>
                    </div>
                    <div className="border rounded-2xl border-blue-300 p-4">
                      <h5 className="text-sm font-bold mb-3 h-10">Социальный пакет</h5>
                      <div className="space-y-2 text-xs">
                        {['Медицинская страховка', 'Оплата больничных', 'Дополнительные дни отпуска', 'Оплата обучения / курсов', 'Оплата сертификаций'].map(i => (
                          <label key={i} className="flex items-center gap-2"><input type="checkbox" value={i} {...register('bonuses.social_package')} /> {i}</label>
                        ))}
                      </div>
                    </div>
                    <div className="border rounded-2xl border-blue-300 p-4">
                      <h5 className="text-sm font-bold mb-3 h-10">Условия и компенсации</h5>
                      <div className="space-y-2 text-xs">
                        {['Компенсация питания', 'Транспорт / топливо', 'Корпоративная связь', 'Ноутбук / техника', 'Релокационный пакет'].map(i => (
                          <label key={i} className="flex items-center gap-2"><input type="checkbox" value={i} {...register('bonuses.compensations')} /> {i}</label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-6">
                  <label className="text-gray-700 font-medium">Крайний срок подачи:</label>
                  <div className="w-full flex gap-4 items-center">
                    <div className="flex items-center gap-2 bg-blue-50/50 p-2 border rounded-lg">
                      <input
                        type="date"
                        {...register('deadline_date')}
                        className="bg-transparent outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50/50 p-2 border rounded-lg">
                      <span className="text-sm text-gray-600">Время:</span>
                      <input
                        type="time"
                        {...register('deadline_time')}
                        className="bg-transparent outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">*Независимо от срока, вакансия будет размещаться 30 дней с момента публикации</p>

            </div>

            {/* STEP 2 */}
            <div className={`space-y-6 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex-1">Детальное описание вакансии - <span className="text-blue-600">ИИ✨</span></h3>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Общие сведения:</label>
                  <div className="col-span-3 w-full">
                    <Controller
                      name="overview"
                      control={control}
                      render={({ field }) => (
                        <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className="bg-white" />
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Требования:*</label>
                  <div className="col-span-3 w-full">
                    <Controller
                      name="qualification_requirements"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className={errors.qualification_requirements ? 'border border-red-400 rounded-lg' : 'bg-white'} />
                          {errors.qualification_requirements && <p className="text-red-500 text-xs mt-1">⚠ {errors.qualification_requirements.message}</p>}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Обязанности:*</label>
                  <div className="col-span-3 w-full">
                    <Controller
                      name="duties"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className={errors.duties ? 'border border-red-400 rounded-lg' : 'bg-white'} />
                          {errors.duties && <p className="text-red-500 text-xs mt-1">⚠ {errors.duties.message}</p>}
                        </div>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Условия:</label>
                  <div className="col-span-3 w-full">
                    <Controller
                      name="conditions"
                      control={control}
                      render={({ field }) => (
                        <ReactQuill theme="snow" value={field.value} onChange={field.onChange} className="bg-white" />
                      )}
                    />
                  </div>
                </div>
              </div>

            {/* STEP 3 */}
            <div className={`space-y-8 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Уведомления:</label>
                  <div className="col-span-3 w-full space-y-2">
                    <label className="flex items-center gap-2"><input type="radio" value="every" {...register('email_notification_frequency')} /> Получать уведомления о каждом отклике на почту</label>
                    <label className="flex items-center gap-2"><input type="radio" value="daily" {...register('email_notification_frequency')} /> Получать уведомления об откликах один раз в день на почту</label>
                    <label className="flex items-center gap-2"><input type="radio" value="every_3_days" {...register('email_notification_frequency')} /> Получать уведомления об откликах раз в три дня</label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Язык отклика:</label>
                  <div className="col-span-3 w-full space-y-2">
                    <label className="flex items-center gap-2"><input type="radio" value="ru" {...register('application_language')} /> Соискатель должен подавать заявку на русском языке</label>
                    <label className="flex items-center gap-2"><input type="radio" value="en" {...register('application_language')} /> Соискатель должен подавать заявку на английском языке</label>
                    <label className="flex items-center gap-2"><input type="radio" value="ky" {...register('application_language')} /> Соискатель должен подавать заявку на кыргызском языке</label>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <label className="text-gray-700 font-medium">Способ подачи заявки:</label>
                  <div className="col-span-3 w-full space-y-4">
                    <label className="flex items-start gap-2">
                      <input type="radio" value="employment" {...register('request_type')} className="mt-1" />
                      <span>Для подачи заявки, соискатели должны откликнуться через employment.kg</span>
                    </label>
                    
                    <label className="flex items-start gap-2">
                      <input type="radio" value="employment_form" {...register('request_type')} className="mt-1" />
                      <div>
                        Для подачи заявки, соискатели должны откликнуться через employment.kg заполнив вашу специальную форму.<br/>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Прикрепить (файл должен быть только в DOC, DOCX или PDF формате):</span>
                          <button type="button" className="text-gray-500 underline flex items-center text-sm gap-1"><UploadCloud className="w-4 h-4"/> [ Загрузить ]</button>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2">
                      <input type="radio" value="external_link" {...register('request_type')} className="mt-1" />
                      <div className="w-full">
                        Для подачи заявки, соискатели должны перейти на ваш сайт и заполнить Вашу специальную онлайн форму.<br/>
                        Укажите ссылку на Вашу онлайн форму здесь:
                        {formData.request_type === 'external_link' && (
                          <input type="url" {...register('link_online_form')} className="mt-2 w-full p-2 border rounded-lg" placeholder="https://" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div className="text-sm text-gray-500 pt-8 border-t">
                  Публикуя вакансию на сайте, Вы соглашаетесь с условиями размещения вакансии. <br/>
                  Ваша вакансия будет опубликована на сайте после модерации
                </div>
              </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
              <div className="flex gap-4">
                {currentStep > 1 ? (
                  <button type="button" onClick={handlePrev} className="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium">
                    [← Назад]
                  </button>
                ) : <div></div>}
              </div>
              
              <div className="flex gap-4">
                <button type="button" onClick={handleSaveDraft} disabled={isSubmitting} className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors disabled:opacity-50">
                  Сохранить черновик
                </button>
                {currentStep === 3 && (
                  <button type="button" onClick={() => setIsPreview(true)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
                    [ Предварительный просмотр ]
                  </button>
                )}
                {currentStep < 3 ? (
                  <button type="button" onClick={handleNext} className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                    [ Далее → ]
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      // Явно валидируем все поля шага 3 перед отправкой
                      const step3Fields = ['email_notification_frequency', 'application_language', 'request_type'] as const;
                      const isStep3Valid = await trigger(step3Fields);
                      if (!isStep3Valid) {
                        toast.error('Заполните все обязательные поля', { duration: 4000 });
                        return;
                      }
                      // Дополнительная проверка зарплаты (рутина в шаге 1, но на всякий случай)
                      const currentFormData = getValues();
                      if (currentFormData.salary_type !== 'none') {
                        if (!currentFormData.wages_from || !currentFormData.currency) {
                          toast.error("Укажите зарплату и валюту, либо выберите 'Не указывать'", { duration: 5000 });
                          return;
                        }
                        if (currentFormData.salary_type === 'range' && !currentFormData.wages_to) {
                          toast.error("Укажите верхнюю границу зарплаты", { duration: 5000 });
                          return;
                        }
                      }
                      handleSubmit(onSubmit)();
                    }}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Сохранение...' : (
                      vacancyId
                        ? (initialData?.draft ? 'Опубликовать вакансию' : 'Обновить вакансию')
                        : 'Отправить на публикацию'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
