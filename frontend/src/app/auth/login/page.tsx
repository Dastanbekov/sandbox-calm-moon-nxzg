'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          setGlobalError(data);
        } else if (data.detail) {
          if (err.response?.status === 403 || data.detail.includes('not activated') || data.detail.includes('подтвердите')) {
            setGlobalError('Пожалуйста, подтвердите ваш email. Проверьте папку "Спам", если письмо не пришло.');
          } else if (data.detail.includes('No active account') || data.detail === 'No active account found with the given credentials') {
            setGlobalError('Неверный E-mail или пароль. Попробуйте еще раз.');
          } else {
            setGlobalError(data.detail);
          }
        } else {
          setFieldErrors(data);
          const firstErrorField = Object.keys(data)[0];
          const el = document.getElementById(firstErrorField);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }
      } else {
        setGlobalError('Ошибка при входе. Сервер не отвечает, попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-6">
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Войти</h2>
          <p className="mt-2 text-sm text-slate-500">
            Войдите в свой личный кабинет.
          </p>
        </div>

        {globalError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {globalError}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">ВАШ E-MAIL</label>
            <input 
              type="email" 
              name="email" 
              className={`w-full rounded-xl border bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 text-[15px] shadow-xs ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#4452c9] focus:ring-[#4452c9]/10'}`}
              id="email" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {fieldErrors.email && (
              <span className="text-red-500 text-sm mt-1">{fieldErrors.email.join(', ')}</span>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">ПАРОЛЬ</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                className={`w-full rounded-xl border bg-white pl-4 pr-12 py-3 text-slate-900 focus:outline-none focus:ring-2 transition-all placeholder-slate-400 text-[15px] shadow-xs ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#4452c9] focus:ring-[#4452c9]/10'}`}
                id="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-red-500 text-sm mt-1">{fieldErrors.password.join(', ')}</span>
            )}
          </div>

          <div className="flex items-center justify-end">
            <Link 
              href="/auth/forgot-password" 
              className="text-sm font-medium text-[#4452c9] hover:text-[#3642a8] transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-[16px] flex items-center justify-center cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>



        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500">У вас еще нет аккаунта?</p>
          <Link 
            href="/auth/register" 
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold py-3.5 px-6 rounded-xl border border-slate-200 transition-all text-[15px] flex items-center justify-center cursor-pointer text-center uppercase tracking-wider"
          >
            регистрация
          </Link>
        </div>

      </div>
    </div>
  );
}
