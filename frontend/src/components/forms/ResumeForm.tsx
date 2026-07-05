'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { lookupsService } from '@/services/lookups.service';
import { api } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, GraduationCap, Languages, Briefcase, Target, Layers, Plus, Trash2, Camera, FileText, UploadCloud, Loader2 } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

const experienceSchema = z.object({
  position: z.string().min(1, 'Укажите должность'),
  company_name: z.string().min(1, 'Укажите компанию'),
  exp_start_work: z.string().min(1, 'Укажите начало'),
  exp_end_work: z.string().optional(),
  duties: z.string().optional(),
});

const languageSchema = z.object({
  language: z.string().min(1, 'Выберите язык'),
  language_proficiency: z.string().min(1, 'Укажите уровень'),
});

const institutionSchema = z.object({
  institution_name: z.string().min(1, 'Укажите учебное заведение'),
  faculty: z.string().optional(),
  specialization: z.string().min(1, 'Укажите специальность'),
  inst_end_study: z.string().min(1, 'Укажите год выпуска'),
});

const extraInstitutionSchema = z.object({
  extra_inst_title: z.string().min(1, 'Введите название'),
  extra_inst_organizer: z.string().optional(),
  extra_inst_date: z.string().optional(),
  extra_inst_location: z.string().optional(),
});

const resumeSchema = z.object({
  language: z.coerce.string().min(1, 'Выберите язык резюме'),
  name: z.string().min(1, 'Введите имя'),
  sname: z.string().min(1, 'Введите фамилию'),
  mname: z.string().optional(),
  date_of_birth: z.string().min(1, 'Укажите дату рождения'),
  phone: z.string().min(1, 'Введите телефон'),
  citizenship: z.string().optional(),
  
  photo: z.any().optional(),

  institutions: z.array(institutionSchema).optional(),
  extra_institutions: z.array(extraInstitutionSchema).optional(),

  native_language: z.string().min(1, 'Укажите родной язык'),
  resume_languages: z.array(languageSchema).optional(),

  work_experiences: z.array(experienceSchema).optional(),

  career_objective: z.string().min(1, 'Укажите желаемую должность'),
  city: z.string().min(1, 'Выберите город'),
  salary: z.string().optional(),
  scope: z.string().min(1, 'Выберите сферу деятельности'),
  busyness: z.string().optional(),

  about_me: z.string().optional(),
  
  file1: z.any().optional(),
  file2: z.any().optional(),
  file3: z.any().optional(),
});

type ResumeFormValues = z.infer<typeof resumeSchema>;

const BASE_STEPS = [
  { id: 1, label: 'Общие сведения', icon: User },
  { id: 2, label: 'Образование', icon: GraduationCap },
  { id: 3, label: 'Языки', icon: Languages },
  { id: 4, label: 'Опыт работы', icon: Briefcase },
  { id: 5, label: 'Желаемая должность', icon: Target },
  { id: 6, label: 'Доп. информация', icon: Layers },
];

interface ResumeFormProps {
  initialData?: any;
  resumeId?: string;
}

export default function ResumeForm({ initialData, resumeId }: ResumeFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(resumeId ? 1 : 0);
  const steps = resumeId ? BASE_STEPS : [{ id: 0, label: 'Смарт-импорт', icon: FileText }, ...BASE_STEPS];
  
  const [lookups, setLookups] = useState<any>({ 
    cities: [], languages: [], languageProficiencies: [], scopes: [], citizenships: [], busynesses: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const {
    register, control, handleSubmit, watch, setValue, trigger, getValues, formState: { errors }
  } = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeSchema),
    defaultValues: initialData || {
      name: user?.name || '',
      sname: user?.sname || '',
      phone: user?.phone || '',
      language: '',
      date_of_birth: '',
      citizenship: '',
      native_language: '',
      city: '',
      career_objective: '',
      salary: '',
      scope: '',
      busyness: '',
      about_me: '',
      work_experiences: [],
      institutions: [],
      extra_institutions: [],
      resume_languages: [],
    } as Partial<ResumeFormValues>,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'work_experiences' });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: 'resume_languages' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'institutions' });
  const { fields: extraEduFields, append: appendExtraEdu, remove: removeExtraEdu } = useFieldArray({ control, name: 'extra_institutions' });

  const photoFile = watch('photo');
  const existingPhoto = initialData?.photo && typeof initialData.photo === 'string' ? getImageUrl(initialData.photo) : null;
  const photoPreviewUrl = photoFile && photoFile.length > 0 ? URL.createObjectURL(photoFile[0]) : existingPhoto;

  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) router.push('/auth/login');
      else if (user.user_type !== 'worker') router.push('/');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const data = await lookupsService.getLookups();
        setLookups({
          cities: data.cities || [],
          scopes: data.scopes || [],
          languages: data.languages || [],
          languageProficiencies: data.proficiencies || [],
          busynesses: data.busynesses || [],
          citizenships: data.citizenships || [],
        });
      } catch (error) {
        console.error('Failed to load lookups:', error);
      }
    };
    if (user?.user_type === 'worker') fetchLookups();
  }, [user]);

  const handleParseResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsParsing(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/api/resumes/parse/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const parsedData = res.data;
      
      Object.keys(parsedData).forEach(key => {
        if (parsedData[key] !== null && parsedData[key] !== undefined) {
          if (key === 'city' && typeof parsedData[key] === 'string') {
            const cityName = parsedData[key].toLowerCase();
            const foundCity = lookups.cities.find((c: any) => 
              c.title.toLowerCase().includes(cityName) || cityName.includes(c.title.toLowerCase())
            );
            if (foundCity) setValue('city', String(foundCity.id));
          } else {
            setValue(key as any, parsedData[key]);
          }
        }
      });
      
      toast.success('Резюме успешно проанализировано!');
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Ошибка при анализе резюме');
    } finally {
      setIsParsing(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['name', 'sname', 'phone', 'date_of_birth', 'language'];
    if (currentStep === 2) fieldsToValidate = ['institutions'];
    if (currentStep === 3) fieldsToValidate = ['native_language', 'resume_languages'];
    if (currentStep === 4) fieldsToValidate = ['work_experiences'];
    if (currentStep === 5) fieldsToValidate = ['career_objective', 'scope', 'city'];
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const errorElement = document.querySelector('.text-red-500');
        if (errorElement && errorElement.parentElement) {
          errorElement.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, resumeId ? 1 : 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
  });

  const onSubmit = async (data: ResumeFormValues) => {
    if (!agreedTerms) {
      toast.error('Необходимо согласиться с условиями размещения');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        ...data,
        draft: false,
      };

      if (data.photo && data.photo[0]) {
        payload.photo = await toBase64(data.photo[0]);
      } else { delete payload.photo; }

      if (data.file1 && data.file1[0]) {
        payload.file1 = await toBase64(data.file1[0]);
        payload.filename1 = data.file1[0].name;
      } else { delete payload.file1; }
      
      if (data.file2 && data.file2[0]) {
        payload.file2 = await toBase64(data.file2[0]);
        payload.filename2 = data.file2[0].name;
      } else { delete payload.file2; }
      
      if (data.file3 && data.file3[0]) {
        payload.file3 = await toBase64(data.file3[0]);
        payload.filename3 = data.file3[0].name;
      } else { delete payload.file3; }
      
      let res;
      if (resumeId) {
        res = await api.put(`/api/resumes/${resumeId}/`, payload);
      } else {
        res = await api.post('/api/resumes/create/', payload);
      }
      
      toast.success(resumeId ? 'Резюме успешно обновлено' : 'Резюме успешно создано');
      router.push(`/resumes/${res.data.id || res.data.resume_id || resumeId}`);
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при сохранении резюме');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = () => {
    setTimeout(() => {
      const errorElement = document.querySelector('.text-red-500');
      if (errorElement && errorElement.parentElement) {
        errorElement.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  if (!lookups.cities.length) {
    return <div className="p-8 text-center text-gray-500">Загрузка данных...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{resumeId ? 'Редактировать резюме' : 'Новое резюме'}</h1>
        <p className="text-gray-500">Следуйте нашим советам, и предложение о работе не заставит себя долго ждать!</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Шаги заполнения</span>
            </div>
            <div className="p-2 space-y-1">
              {steps.map((step, index) => {
                const isActive = currentStep === step.id;
                const isPassed = currentStep > step.id;
                const StepIcon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={step.id > currentStep}
                    onClick={() => {
                        if (step.id <= currentStep) setCurrentStep(step.id);
                    }}
                    className={`w-full flex items-center p-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : isPassed 
                          ? 'text-green-600 hover:bg-gray-50 cursor-pointer' 
                          : 'text-gray-400 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      isActive ? 'bg-blue-100 text-blue-600' : isPassed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold">{step.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="flex-1">
          <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            
            {/* STEP 0: AI Parse */}
            {!resumeId && (
              <div className={currentStep === 0 ? 'block space-y-6 animate-in fade-in zoom-in duration-300' : 'hidden'}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Умный импорт резюме</h2>
                
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Есть готовое резюме в PDF?</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Загрузите ваш документ, и наш искусственный интеллект автоматически заполнит все поля. Вам останется только проверить данные.
                  </p>
                  
                  <div className="flex flex-col items-center gap-4">
                    <label className="relative inline-flex items-center justify-center cursor-pointer">
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleParseResume}
                        disabled={isParsing}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                      <div className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm
                        ${isParsing 
                          ? 'bg-gray-200 text-gray-500 border border-gray-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                        }`}
                      >
                        {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                        {isParsing ? 'Анализируем документ...' : 'Загрузить PDF резюме'}
                      </div>
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setCurrentStep(1)}
                      disabled={isParsing}
                      className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors mt-4"
                    >
                      Или пропустить и заполнить вручную
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* STEP 1: General Info */}
            <div className={currentStep === 1 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Общие сведения</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Язык резюме</label>
                  <select {...register('language')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Выберите язык</option>
                    {lookups.languages?.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                  {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language.message}</p>}
                </div>
                <div></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input type="text" {...register('name')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Введите имя" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                  <input type="text" {...register('sname')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Введите фамилию" />
                  {errors.sname && <p className="text-red-500 text-xs mt-1">{errors.sname.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                  <input type="text" {...register('mname')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Введите отчество" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения *</label>
                  <input type="date" {...register('date_of_birth')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                  <input type="text" {...register('phone')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+996..." />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Гражданство</label>
                  <select {...register('citizenship')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Выберите гражданство</option>
                    {lookups.citizenships.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Фотография (необязательно)</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative cursor-pointer hover:bg-gray-200 transition-colors">
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                    <input type="file" accept="image/*" {...register('photo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div className="text-sm text-gray-500 max-w-sm">
                    Наличие качественного и профессионального фото в резюме значительно повышает шансы на успех.
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Education */}
            <div className={currentStep === 2 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Образование</h2>
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-6 border border-blue-100">
                Укажите основное и дополнительное образование. Это поможет работодателю оценить ваш профиль.
              </div>

              {/* Main Education */}
              <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> Основное образование</h3>
                {eduFields.map((field, index) => (
                  <div key={field.id} className="p-5 border border-gray-200 rounded-xl mb-4 relative bg-gray-50/50">
                    <button type="button" onClick={() => removeEdu(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Учебное заведение *</label>
                        <input {...register(`institutions.${index}.institution_name`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: КГТУ им. И. Раззакова" />
                        {errors.institutions?.[index]?.institution_name && <span className="text-red-500 text-xs">{errors.institutions[index].institution_name?.message}</span>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Факультет</label>
                        <input {...register(`institutions.${index}.faculty`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: Информационные технологии" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Специальность *</label>
                        <input {...register(`institutions.${index}.specialization`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: Программная инженерия" />
                        {errors.institutions?.[index]?.specialization && <span className="text-red-500 text-xs">{errors.institutions[index].specialization?.message}</span>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Год выпуска *</label>
                        <input {...register(`institutions.${index}.inst_end_study`)} type="number" min="1950" max="2030" className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="2024" />
                        {errors.institutions?.[index]?.inst_end_study && <span className="text-red-500 text-xs">{errors.institutions[index].inst_end_study?.message}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => appendEdu({ institution_name: '', faculty: '', specialization: '', inst_end_study: '' })} className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700 mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Добавить образование
                </button>
              </div>

              {/* Extra Education */}
              <div className="pt-6 border-t mt-8">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /> Курсы и тренинги</h3>
                {extraEduFields.map((field, index) => (
                  <div key={field.id} className="p-5 border border-gray-200 rounded-xl mb-4 relative bg-gray-50/50">
                    <button type="button" onClick={() => removeExtraEdu(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Название курса/тренинга *</label>
                        <input {...register(`extra_institutions.${index}.extra_inst_title`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: Frontend Developer Bootcamp" />
                        {errors.extra_institutions?.[index]?.extra_inst_title && <span className="text-red-500 text-xs">{errors.extra_institutions[index].extra_inst_title?.message}</span>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Проводившая организация</label>
                        <input {...register(`extra_institutions.${index}.extra_inst_organizer`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: GeekBrains" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Год окончания</label>
                        <input {...register(`extra_institutions.${index}.extra_inst_date`)} type="number" min="1950" max="2030" className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="2023" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => appendExtraEdu({ extra_inst_title: '', extra_inst_organizer: '', extra_inst_date: '', extra_inst_location: '' })} className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700 mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Добавить курс
                </button>
              </div>
            </div>

            {/* STEP 3: Languages */}
            <div className={currentStep === 3 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Владение языками</h2>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Родной язык *</label>
                <select {...register('native_language')} className="w-full md:w-1/2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Выберите родной язык</option>
                  {lookups.languages.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                {errors.native_language && <p className="text-red-500 text-xs mt-1">{errors.native_language.message}</p>}
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-gray-800 mb-4">Иностранные языки</h3>
                {langFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col md:flex-row gap-4 mb-4 items-start p-4 bg-gray-50/50 border border-gray-200 rounded-xl">
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Язык</label>
                      <select {...register(`resume_languages.${index}.language`)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Выберите язык</option>
                        {lookups.languages.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
                      </select>
                      {errors.resume_languages?.[index]?.language && <span className="text-red-500 text-xs">{errors.resume_languages[index].language?.message}</span>}
                    </div>
                    <div className="w-full md:w-1/2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Уровень владения</label>
                        <select {...register(`resume_languages.${index}.language_proficiency`)} className="w-full p-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">Уровень владения</option>
                          {lookups.languageProficiencies.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                        {errors.resume_languages?.[index]?.language_proficiency && <span className="text-red-500 text-xs">{errors.resume_languages[index].language_proficiency?.message}</span>}
                      </div>
                      <button type="button" onClick={() => removeLang(index)} className="p-2.5 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded-xl shadow-sm mb-px hover:bg-red-50 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => appendLang({ language: '', language_proficiency: '' })} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2" /> Добавить иностранный язык
                </button>
              </div>
            </div>

            {/* STEP 4: Work Experience */}
            <div className={currentStep === 4 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Опыт работы</h2>
              <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 mb-6 border border-yellow-100">
                Работодатели обращают наибольшее внимание на опыт работы. Опишите свои обязанности и достижения максимально подробно.
              </div>

              {expFields.map((field, index) => (
                <div key={field.id} className="p-5 border border-gray-200 rounded-xl mb-6 relative bg-gray-50/50">
                  <button type="button" onClick={() => removeExp(index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white p-1 rounded-lg border shadow-sm z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 pr-8">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Должность *</label>
                      <input {...register(`work_experiences.${index}.position`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Например: Менеджер по продажам" />
                      {errors.work_experiences?.[index]?.position && <span className="text-red-500 text-xs">{errors.work_experiences[index].position?.message}</span>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Компания *</label>
                      <input {...register(`work_experiences.${index}.company_name`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white" placeholder="Название компании" />
                      {errors.work_experiences?.[index]?.company_name && <span className="text-red-500 text-xs">{errors.work_experiences[index].company_name?.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Начало работы *</label>
                      <input type="month" {...register(`work_experiences.${index}.exp_start_work`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white text-gray-700" />
                      {errors.work_experiences?.[index]?.exp_start_work && <span className="text-red-500 text-xs">{errors.work_experiences[index].exp_start_work?.message}</span>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Окончание (оставьте пустым, если работаете)</label>
                      <input type="month" {...register(`work_experiences.${index}.exp_end_work`)} className="w-full p-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white text-gray-700" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Обязанности и достижения</label>
                      <textarea {...register(`work_experiences.${index}.duties`)} rows={4} className="w-full p-3 border rounded-lg outline-none focus:border-blue-500 bg-white resize-none" placeholder="Опишите, чем вы занимались и каких результатов достигли..."></textarea>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendExp({ position: '', company_name: '', exp_start_work: '', duties: '' })} className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5 mr-2" /> Добавить место работы
              </button>
            </div>

            {/* STEP 5: Desired Position */}
            <div className={currentStep === 5 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Желаемая должность</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Должность *</label>
                  <input type="text" {...register('career_objective')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Например: Бухгалтер, Программист, Водитель" />
                  {errors.career_objective && <p className="text-red-500 text-xs mt-1">{errors.career_objective.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Профессиональная область *</label>
                  <select {...register('scope')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Выберите сферу</option>
                    {lookups.scopes.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                  {errors.scope && <p className="text-red-500 text-xs mt-1">{errors.scope.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город *</label>
                  <select {...register('city')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Выберите город</option>
                    {lookups.cities.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Желаемая зарплата</label>
                  <div className="flex relative">
                    <input type="number" {...register('salary')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pr-12" placeholder="Например: 50000" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">KGS</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Занятость</label>
                  <select {...register('busyness')} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Выберите тип занятости</option>
                    {lookups.busynesses.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 6: Additional Info */}
            <div className={currentStep === 6 ? 'block space-y-6' : 'hidden'}>
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Дополнительная информация</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Обо мне</label>
                <textarea {...register('about_me')} rows={5} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Расскажите о своих личных качествах, увлечениях, достижениях, не вошедших в другие разделы..."></textarea>
              </div>

              <div className="pt-6 border-t mt-6">
                <h3 className="font-bold text-gray-800 mb-2">Сертификаты и портфолио</h3>
                <p className="text-sm text-gray-500 mb-4">Вы можете прикрепить до 3 файлов (сертификаты, дипломы, портфолио).</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(num => (
                    <div key={num} className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors relative cursor-pointer group h-32">
                      <input type="file" {...register(`file${num}` as any)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Layers className="w-6 h-6 text-gray-400 mb-2 group-hover:text-blue-500" />
                      <span className="text-xs font-medium text-gray-600 line-clamp-1 w-full px-2">
                        Файл {num}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">Нажмите для выбора</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 mt-4">
                <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    Публикуя резюме, Вы подтверждаете, что вся указанная информация является достоверной, и соглашаетесь с правилами размещения на портале employment.kg.
                  </span>
                </label>
              </div>
            </div>

            {/* Form Footer / Navigation */}
            {currentStep > 0 && (
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button type="button" onClick={handlePrev} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                    Назад
                  </button>
                ) : <div></div>}
                
                {currentStep < 6 ? (
                  <button type="button" onClick={handleNext} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-blue-200">
                    Далее
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting || !agreedTerms} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Сохранение...' : (resumeId ? 'Сохранить изменения' : 'Опубликовать резюме')}
                  </button>
                )}
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
