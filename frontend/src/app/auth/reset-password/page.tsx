'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/auth.service';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Недействительная ссылка</h3>
        <p className="text-sm text-gray-500 mb-6">Ссылка для сброса пароля недействительна или устарела.</p>
        <Link href="/auth/forgot-password" className="text-blue-600 hover:underline font-medium">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await api.post('/api/auth/password/reset/', { 
        token, 
        email, 
        password, 
        password_confirmation: passwordConfirm 
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при сбросе пароля. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
        <CheckCircle2 className="text-green-500 w-12 h-12 mx-auto mb-3" />
        <h3 className="font-bold text-gray-900 mb-2">Пароль успешно изменен</h3>
        <p className="text-sm text-gray-600 mb-6">Теперь вы можете войти в аккаунт с новым паролем. Вы будете перенаправлены на страницу входа.</p>
        <Link 
          href="/auth/login"
          className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm"
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5 opacity-50">
        <label className="text-sm font-bold text-slate-700">Email адрес</label>
        <input 
          type="email" 
          className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-900 text-[15px] cursor-not-allowed" 
          value={email}
          disabled
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Новый пароль</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type={showPassword ? "text" : "password"} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 py-3 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[15px]" 
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button 
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-bold text-slate-700">Подтвердите пароль</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type={showPassword ? "text" : "password"} 
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-12 py-3 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[15px]" 
            placeholder="Повторите пароль"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 text-[16px] flex items-center justify-center cursor-pointer" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Сохранение...' : 'Сбросить пароль'}
        </button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Новый пароль</h2>
          <p className="text-sm text-slate-500">
            Придумайте надежный пароль для вашего аккаунта
          </p>
        </div>

        <div className="relative z-10">
          <Suspense fallback={<div className="text-center py-4">Загрузка...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        
      </div>
    </div>
  );
}
