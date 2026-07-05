'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import { lookupsService } from '@/services/lookups.service';
import { UploadCloud } from 'lucide-react';
import Select from 'react-select';
import { countryFlags } from '@/lib/countryFlags';
import MapPicker from '@/components/MapPicker';
export default function ProfilePage() {
  const isInitialized = useRef(false);
  const { user, checkAuth } = useAuth();
  
  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  const isEmployer = user?.user_type === 'employer';
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [initialCompanyForm, setInitialCompanyForm] = useState<any>(null);
  const [initialWorkerForm, setInitialWorkerForm] = useState<any>(null);

  const [cities, setCities] = useState<any[]>([]);
  const [scopes, setScopes] = useState<any[]>([]);
  const [citizenships, setCitizenships] = useState<any[]>([]);

  // Employer Form
  const [companyForm, setCompanyForm] = useState({
    title: '',
    org_type: '',
    scope: '',
    site: '',
    city: '',
    address: '',
    google_map_code: '',
    size: '',
    about_company: '',
    inn: '',
    logo: '',
    logoFile: null as File | null,
    fio: '',
    show_fio: true,
    phone: '',
    show_phone: true,
    email: '',
    show_email: true,
    show_site: true,
    show_all_contacts: false,
  });



  // Worker Form
  const [workerForm, setWorkerForm] = useState({
    name: '',
    sname: '',
    mname: '',
    date_of_birth: '',
    phone: '',
    citizenship: '',
    gender: '',
    city: '',
    search_status: '',
    photo: '',
    photoFile: null as File | null,
  });

  useEffect(() => {
    lookupsService.getLookups().then(res => {
      setCities(res.cities || []);
      setScopes(res.scopes || []);
      setCitizenships(res.citizenships || []);
    });
  }, []);

  useEffect(() => {
    if (user && !isInitialized.current) {
      isInitialized.current = true;
      if (user.company) {
        const cForm = {
          title: user.company?.title || '',
          org_type: user.company?.org_type || '',
          scope: user.company?.scope ? String(user.company.scope) : '',
          site: user.company?.site || '',
          city: user.company?.city ? String(user.company.city) : '',
          address: user.company?.address || '',
          google_map_code: user.company?.google_map_code || '',
          size: user.company?.size || '',
          about_company: user.company?.about_company || '',
          inn: user.company?.inn || '',
          logo: '',
          logoFile: null,
          fio: user.company?.fio || '',
          show_fio: user.company?.show_fio ?? true,
          phone: user.company?.phone || '',
          show_phone: user.company?.show_phone ?? true,
          email: user.company?.email || '',
          show_email: user.company?.show_email ?? true,
          show_site: user.company?.show_site ?? true,
          show_all_contacts: false,
        };
        setCompanyForm(cForm);
        setInitialCompanyForm(cForm);
      }
      if (user.profile) {
        const wForm = {
          name: user.profile?.name || '',
          sname: user.profile?.sname || '',
          mname: user.profile?.mname || '',
          date_of_birth: user.profile?.date_of_birth || '',
          phone: user.profile?.phone || '',
          citizenship: user.profile?.citizenship ? String(user.profile.citizenship) : '',
          gender: user.profile?.gender || '',
          city: user.profile?.city ? String(user.profile.city) : '',
          search_status: user.profile?.search_status || '',
          photo: user.photo || '',
          photoFile: null,
        };
        setWorkerForm(wForm);
        setInitialWorkerForm(wForm);
      }
    }
  }, [user]);
  useEffect(() => {
    if (!initialCompanyForm && !initialWorkerForm) return;

    const currentForm = isEmployer ? companyForm : workerForm;
    const initialForm = isEmployer ? initialCompanyForm : initialWorkerForm;

    // simple deep check on the relevant values
    const isDirty = Object.keys(currentForm).some(key => {
      if (key === 'logoFile' || key === 'photoFile') return currentForm[key as keyof typeof currentForm] !== null;
      if (key === 'logo' || key === 'photo') return false; // skip image preview url changes if any
      return currentForm[key as keyof typeof currentForm] !== initialForm?.[key as keyof typeof initialForm];
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [companyForm, workerForm, initialCompanyForm, initialWorkerForm, isEmployer]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setCompanyForm(prev => ({ ...prev, logo: localUrl }));

    try {
      const res = await api.patch('/api/companies/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompanyForm(prev => ({ ...prev, logo: res.data.logo || localUrl }));
      await checkAuth();
      setSuccess('Логотип успешно обновлен!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Ошибка при загрузке логотипа: ' + (err?.response?.data?.detail || 'Попробуйте снова.'));
      setTimeout(() => setError(''), 4000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWorkerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setWorkerForm(prev => ({ ...prev, photo: localUrl }));

    try {
      const res = await api.patch('/api/profiles/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const serverPhoto = res.data?.user?.photo || res.data?.photo || localUrl;
      setWorkerForm(prev => ({ ...prev, photo: serverPhoto }));
      await checkAuth();
      setSuccess('Фото успешно загружено!');
      setTimeout(() => setSuccess(''), 3000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError('Ошибка при загрузке фото: ' + (err?.response?.data?.detail || 'Попробуйте снова.'));
      setTimeout(() => setError(''), 4000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
        setFieldErrors({});
    setSuccess('');
    try {
      if (isEmployer) {
        const formData = new FormData();
        Object.entries(companyForm).forEach(([key, value]) => {
          if (key === 'logoFile' && (value as any) instanceof File) {
            formData.append('logo', value as any);
          } else if (key !== 'logoFile' && key !== 'logo' && value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        await api.patch('/api/companies/me/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const formData = new FormData();
        Object.entries(workerForm).forEach(([key, value]) => {
          if (key === 'photoFile' && (value as any) instanceof File) {
            formData.append('photo', value as unknown as File);
          } else if (key !== 'photoFile' && key !== 'photo' && value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        await api.patch('/api/profiles/me/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await checkAuth();
      if (isEmployer) {
        setInitialCompanyForm({...companyForm});
      } else {
        setInitialWorkerForm({...workerForm});
      }
      setSuccess('Профиль успешно обновлен!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError('Ошибка при сохранении профиля. Проверьте правильность заполнения полей.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowAllContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setCompanyForm(prev => ({
      ...prev,
      show_all_contacts: checked,
      show_fio: checked,
      show_phone: checked,
      show_email: checked,
      show_site: checked
    }));
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {isEmployer ? 'Профиль организации' : 'Мой профиль'}
        </h1>
        <p className="text-slate-500 text-sm">
          {isEmployer ? 'Заполните информацию о вашей организации. Это повысит доверие соискателей.' : 'Заполните информацию о вас. Эти данные помогут нам лучше работать с вами.'}
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[15px] flex items-center gap-3 mb-6">
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[15px] flex items-center gap-3 mb-6">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        {isEmployer ? (
          <>
            {/* 1. Основные данные (2 flex колонки) */}
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Левая колонка */}
              <div className="flex-1 space-y-6">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Название организации <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    id="field-title" value={companyForm.title}
                    onChange={e => setCompanyForm({...companyForm, title: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  {fieldErrors.title && <p className="text-rose-500 text-xs mt-1">{fieldErrors.title}</p>}
                </div>


                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Сфера деятельности <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={companyForm.scope}
                    id="field-scope" onChange={e => setCompanyForm({...companyForm, scope: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[position:right_16px_center] bg-no-repeat"
                  >
                    <option value="">Выберите сферу</option>
                    {scopes.map(scope => (
                      <option key={scope.id} value={scope.id}>{scope.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Город/село <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={companyForm.city}
                    id="field-city" onChange={e => setCompanyForm({...companyForm, city: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[position:right_16px_center] bg-no-repeat"
                  >
                    <option value="">Выберите локацию</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>{city.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Адрес</label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={e => setCompanyForm({...companyForm, address: e.target.value})}
                    placeholder="например, ул. Байтик Баатыра 123"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Положение на карте</label>
                  <MapPicker 
                    value={companyForm.google_map_code} 
                    onChange={v => setCompanyForm({...companyForm, google_map_code: v})} 
                  />
                </div>
              </div>

              {/* Правая колонка */}
              <div className="flex-1 space-y-6">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Тип организации <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={companyForm.org_type}
                    id="field-org_type" onChange={e => setCompanyForm({...companyForm, org_type: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%221.66667%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[position:right_16px_center] bg-no-repeat"
                  >
                    <option value="">Выберите тип</option>
                    <option value="ОсОО">ОсОО</option>
                    <option value="ЗАО">ЗАО</option>
                    <option value="ОАО">ОАО</option>
                    <option value="ИП">ИП</option>
                    <option value="Представительство / Филиал">Представительство / Филиал</option>
                    <option value="НКО">НКО</option>
                    <option value="Международная организация">Международная организация</option>
                    <option value="Государственная организация">Государственная организация</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Сайт организации</label>
                  <input
                    type="url"
                    value={companyForm.site}
                    onChange={e => setCompanyForm({...companyForm, site: e.target.value})}
                    placeholder="https://"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Размер вашей организации <span className="text-rose-500">*</span></label>
                  <div className="flex flex-col gap-2 mt-2">
                    {['1-5 сотрудников', '6-20 сотрудников', '21-50 сотрудников', '51-200 сотрудников', 'Более 200 сотрудников'].map(size => {
                      const val = size.split(' ')[0]; // '1-5', '6-20' ...
                      const actualVal = val === 'Более' ? '200+' : val;
                      return (
                        <label key={actualVal} className="flex items-center gap-2 text-[15px] text-slate-700 cursor-pointer">
                          <input 
                            type="radio" 
                            name="company_size" id="field-size"
                            value={actualVal} 
                            checked={companyForm.size === actualVal}
                            onChange={e => setCompanyForm({...companyForm, size: e.target.value})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          />
                          {size}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">Об организации <span className="text-slate-400 font-normal text-xs ml-1">(максимум 200 слов)</span></label>
                  <textarea
                    value={companyForm.about_company}
                    onChange={e => setCompanyForm({...companyForm, about_company: e.target.value})}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    placeholder=""
                  />
                </div>
              </div>
            </div>



            {/* Блок ИНН и Логотипа */}
            <div className="bg-[#eef4ff] border border-blue-200 rounded-2xl p-6 mt-8">
              <div className="flex items-start gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Станьте проверенной организацией
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 1.5L15.3 4.3L18.9 3.5L19.5 7.1L22.7 8.5L21.5 12L23.5 14.9L20.7 17L20.5 20.7L16.9 21L15 24L13 22.5L11 24L9.1 21L5.5 20.7L5.3 17L2.5 14.9L4.5 12L3.3 8.5L6.5 7.1L7.1 3.5L10.7 4.3L13 1.5Z" fill="#2563EB"/>
                      <path d="M9.5 13L12 15.5L16.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {user?.company?.is_verified && (
                      <span className="text-xs text-blue-600 font-normal bg-blue-100 px-2 py-0.5 rounded-full">Верифицирована ✓</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-700 mt-1">
                    Укажите ИНН и загрузите логотип вашей компании. 
                    {user?.company?.is_verified 
                      ? ' Ваша компания подтверждена. Теперь рядом с вашим названием отображается синяя галочка.'
                      : ' После проверки ваших данных (около 2-х дней) ваша организация может получить статус проверенной.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-4">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-red-600">ИНН:</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={companyForm.inn}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCompanyForm({...companyForm, inn: val});
                    }}
                    placeholder="01234567810011"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-900">Логотип:</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                      {companyForm.logo || user?.company?.logo ? (
                        <img src={getImageUrl(companyForm.logo || user?.company?.logo)} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <UploadCloud className="text-slate-400" />
                      )}
                    </div>
                    <div>
                      <input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      <label htmlFor="logoUpload" className="cursor-pointer text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors">
                        Загрузить
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 my-8" />

            {/* 3. Контактные данные */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-6">Контактные данные, которые доступны для соискателей</h3>
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={companyForm.show_fio}
                    onChange={e => setCompanyForm({...companyForm, show_fio: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-1" 
                  />
                  <div className="w-32 text-sm font-medium text-slate-700 flex-shrink-0">ФИО контактного лица</div>
                  <input 
                    type="text" 
                    value={companyForm.fio}
                    onChange={e => setCompanyForm({...companyForm, fio: e.target.value})}
                    placeholder="ФИО"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" 
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={companyForm.show_phone}
                    onChange={e => setCompanyForm({...companyForm, show_phone: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-1" 
                  />
                  <div className="w-32 text-sm font-medium text-slate-700 flex-shrink-0">Телефон</div>
                  <input 
                    type="text" 
                    value={companyForm.phone}
                    onChange={e => setCompanyForm({...companyForm, phone: e.target.value})}
                    placeholder="+996 555 123 456"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={companyForm.show_email}
                    onChange={e => setCompanyForm({...companyForm, show_email: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-1" 
                  />
                  <div className="w-32 text-sm font-medium text-slate-700 flex-shrink-0">Имейл</div>
                  <input 
                    type="email" 
                    value={companyForm.email}
                    onChange={e => setCompanyForm({...companyForm, email: e.target.value})}
                    placeholder="example@mail.com"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" 
                  />
                </div>

                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={companyForm.show_site}
                    onChange={e => setCompanyForm({...companyForm, show_site: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-1" 
                  />
                  <div className="w-32 text-sm font-medium text-slate-700 flex-shrink-0">Сайт организации</div>
                  <input 
                    type="url" 
                    value={companyForm.site}
                    onChange={e => setCompanyForm({...companyForm, site: e.target.value})}
                    placeholder="https://"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    checked={companyForm.show_all_contacts}
                    onChange={handleShowAllContacts}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-sm font-medium text-slate-700">Показать все контактные данные на сайте</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Форма для соискателя */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Имя <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={workerForm.name}
                  onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Фамилия <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={workerForm.sname}
                  onChange={e => setWorkerForm({...workerForm, sname: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Отчество</label>
                <input
                  type="text"
                  value={workerForm.mname}
                  onChange={e => setWorkerForm({...workerForm, mname: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Дата рождения <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  required
                  value={workerForm.date_of_birth}
                  onChange={e => setWorkerForm({...workerForm, date_of_birth: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Телефон <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={workerForm.phone}
                  onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-blue-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Гражданство <span className="text-rose-500">*</span></label>
                <Select
                  options={citizenships.map(c => ({ 
                    value: String(c.id), 
                    label: countryFlags[c.title] ? `${countryFlags[c.title]} ${c.title}` : c.title 
                  }))}
                  value={
                    workerForm.citizenship 
                      ? citizenships.filter(c => String(c.id) === String(workerForm.citizenship)).map(c => ({ 
                          value: String(c.id), 
                          label: countryFlags[c.title] ? `${countryFlags[c.title]} ${c.title}` : c.title 
                        }))[0]
                      : null
                  }
                  onChange={(selected: any) => setWorkerForm({...workerForm, citizenship: selected ? selected.value : ''})}
                  placeholder="Выберите гражданство"
                  isSearchable
                  noOptionsMessage={() => "Ничего не найдено"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.75rem',
                      borderColor: '#e2e8f0',
                      padding: '4px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#cbd5e1'
                      }
                    })
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Пол <span className="text-rose-500">*</span></label>
                <div className="flex gap-6 mt-3" id="field-gender">
                      {fieldErrors.gender && <p className="text-rose-500 text-xs absolute -mt-4">{fieldErrors.gender}</p>}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" required name="gender" value="F" checked={workerForm.gender === 'F'} onChange={e => setWorkerForm({...workerForm, gender: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Женщина</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" required name="gender" value="M" checked={workerForm.gender === 'M'} onChange={e => setWorkerForm({...workerForm, gender: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Мужчина</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Город проживания <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={workerForm.city}
                  id="field-city" onChange={e => setWorkerForm({...workerForm, city: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 py-3 text-[15px] focus:border-blue-500 outline-none"
                >
                  <option value="">Выберите город</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <label className="block text-sm font-semibold text-slate-700">Статус поиска работы <span className="text-rose-500">*</span></label>
              <div className="flex flex-col gap-3" id="field-search_status">
                    {fieldErrors.search_status && <p className="text-rose-500 text-xs mb-1">{fieldErrors.search_status}</p>}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" required name="search_status" value="active" checked={workerForm.search_status === 'active'} onChange={e => setWorkerForm({...workerForm, search_status: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[15px] text-slate-700">Активно ищу работу</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" required name="search_status" value="considering" checked={workerForm.search_status === 'considering'} onChange={e => setWorkerForm({...workerForm, search_status: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[15px] text-slate-700">Рассматриваю предложения</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" required name="search_status" value="not_looking" checked={workerForm.search_status === 'not_looking'} onChange={e => setWorkerForm({...workerForm, search_status: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                  <span className="text-[15px] text-slate-700">Пока не ищу работу</span>
                </label>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">Фото</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex flex-col items-center justify-center overflow-hidden border border-slate-200">
                   {workerForm.photo ? (
                      <img src={getImageUrl(workerForm.photo)} alt="Photo" className="w-full h-full object-cover" />
                   ) : (
                      <span className="text-slate-400 text-xs text-center px-2">Нет фото</span>
                   )}
                </div>
                <div>
                  <label className="text-blue-600 text-sm font-semibold border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50 transition-colors cursor-pointer inline-block">
                    Загрузить фото
                    <input type="file" className="hidden" accept="image/*" onChange={handleWorkerPhotoUpload} />
                  </label>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs">
                    Наличие фото повышает доверие работодателей.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="pt-6 border-t border-slate-100 flex justify-center md:justify-start">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}
