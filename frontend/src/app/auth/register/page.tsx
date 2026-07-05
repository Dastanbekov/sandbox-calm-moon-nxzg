'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import ReCAPTCHA from 'react-google-recaptcha';
import { Eye, EyeOff } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();

  const inviteToken = searchParams.get('invite_token');
  const initialEmail = searchParams.get('email') || '';
  const companyName = searchParams.get('company_name') || '';

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'workers' | 'employers'>('workers');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (inviteToken) {
      setRole('employers');
      setStep(2);
    }
  }, [inviteToken]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError('Пожалуйста, подтвердите, что вы не робот');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email,
        phone,
        password,
        user_type: role === 'workers' ? 'worker' : 'employer',
        name,
        invite_token: inviteToken || undefined,

        recaptcha_token: recaptchaToken || 'dummy_token'
      });
      setSuccess('Регистрация успешна! На вашу почту отправлено письмо с ссылкой для подтверждения.');
      setTimeout(() => {
        router.push('/auth/login');
      }, 6000);
    } catch (err: any) {
      if (err.response?.data) {
        const data = err.response.data;
        if (data.email) {
          setError('Пользователь с таким email уже существует.');
        } else if (data.phone) {
          setError('Пользователь с таким телефоном уже существует.');
        } else if (typeof data === 'string') {
          setError(data);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          // generic
          const firstKey = Object.keys(data)[0];
          setError(`Пожалуйста, проверьте поле "${firstKey}": ${data[firstKey]}`);
        }
      } else {
        setError('Ошибка при регистрации. Проверьте правильность введенных данных.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-6">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Регистрация</h2>
          <p className="mt-2 text-sm text-slate-500">
            Создайте аккаунт, чтобы начать пользоваться платформой.
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm text-center">
            {success}
            <div className="mt-4">
              <Link href="/auth/login" className="text-[#4452c9] font-medium hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </div>
        ) : (
          <>
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
        <form id="auth-register-step1" className="space-y-5" onSubmit={handleNextStep}>
          
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <label className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${role === 'workers' ? 'bg-white text-[#4452c9] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              <input 
                type="radio" 
                required 
                name="role" 
                value="workers" 
                className="sr-only"
                checked={role === 'workers'}
                onChange={() => setRole('workers')}
              />
              Я соискатель
            </label>
            <label className={`flex items-center justify-center py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${role === 'employers' ? 'bg-white text-[#4452c9] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              <input 
                type="radio" 
                required 
                name="role" 
                value="employers" 
                className="sr-only"
                checked={role === 'employers'}
                onChange={() => setRole('employers')}
              />
              Я работодатель
            </label>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-[16px] flex items-center justify-center cursor-pointer" 
            >
              Далее
            </button>
          </div>
        </form>
        ) : (
        <form id="auth-register-step2" className="space-y-5" onSubmit={handleSubmit}>
          
          {inviteToken && companyName && (
            <div className="flex flex-col gap-1.5 opacity-70">
              <label className="text-sm font-medium text-slate-700">НАЗВАНИЕ ОРГАНИЗАЦИИ</label>
              <input 
                type="text" 
                readOnly 
                value={companyName}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 text-[15px] cursor-not-allowed" 
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" id="name-label" className="text-sm font-medium text-slate-700">
              {role === 'employers' && !inviteToken ? 'НАЗВАНИЕ ОРГАНИЗАЦИИ' : 'ВАШЕ ФИО'}
            </label>
            <input 
              type="text" 
              required 
              name="name" 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
              id="name" 
              placeholder={role === 'employers' && !inviteToken ? 'Укажите название' : 'Укажите ваше ФИО'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">ВАШ E-MAIL</label>
            <input 
              type="email" 
              required 
              name="email" 
              readOnly={!!inviteToken}
              className={`w-full rounded-xl border px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs ${inviteToken ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed opacity-70' : 'bg-white border-slate-200'}`} 
              id="field-email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && <p className="text-rose-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-slate-700">ТЕЛЕФОН</label>
            <PhoneInput
              defaultCountry="kg"
              value={phone}
              onChange={(phone) => setPhone(phone)}
              style={{ display: 'flex' }}
              inputClassName="w-full !h-[48px] !text-[15px] !rounded-r-xl !border-slate-200 !border-l-0 focus:!outline-none"
              countrySelectorStyleProps={{ buttonClassName: "!h-[48px] !rounded-l-xl !border-slate-200 !px-3 !bg-slate-50" }}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">СОЗДАТЬ ПАРОЛЬ</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                name="password" 
                className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                id="field-password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <p className="text-rose-500 text-xs mt-1">{fieldErrors.password}</p>}
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password_confirmation" className="text-sm font-medium text-slate-700">ПОДТВЕРДИТЬ ПАРОЛЬ</label>
            <div className="relative">
              <input 
                type={showPasswordConfirm ? "text" : "password"} 
                required 
                name="password_confirmation" 
                className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                id="password_confirmation" 
                placeholder="Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              >
                {showPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
            <div className="flex justify-center my-4">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token: string | null) => setRecaptchaToken(token || '')}
              />
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 my-4">
              <p>Регистрация в тестовом режиме (без капчи)</p>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={() => setStep(1)}
              className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-[16px] flex items-center justify-center cursor-pointer" 
            >
              Назад
            </button>
            <button 
              type="submit" 
              className="w-2/3 bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-[16px] flex items-center justify-center cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>
        </form>
        )}
        </>
        )}



        <div className="text-center">
          <p className="text-sm text-slate-500">Уже есть аккаунт?{' '}
            <Link 
              href="/auth/login" 
              className="font-semibold text-[#4452c9] hover:text-[#3642a8] transition-colors"
            >
              Войти
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
