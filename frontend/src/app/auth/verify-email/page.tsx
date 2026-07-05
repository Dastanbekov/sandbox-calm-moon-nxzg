'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Проверка токена...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Отсутствует токен подтверждения.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Ваш email успешно подтвержден!');
        setTimeout(() => {
          router.push('/cabinet/profile');
        }, 2000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Недействительный или устаревший токен.');
      });
  }, [token, verifyEmail, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Подтверждение Email</h2>
        
        {status === 'loading' && (
          <p className="text-slate-500 animate-pulse">{message}</p>
        )}

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {message}
            <p className="mt-2 text-xs opacity-75">Перенаправляем в личный кабинет...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {message}
            <div className="mt-4">
              <Link href="/auth/login" className="text-[#4452c9] font-medium hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Загрузка...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
