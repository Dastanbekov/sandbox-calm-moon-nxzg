'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/auth.service';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.post('/api/auth/password/forgot/', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке запроса. Возможно, email не зарегистрирован.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 space-y-6 relative overflow-hidden">
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Забыли пароль?</h2>
          <p className="text-sm text-slate-500">
            Введите ваш email, и мы отправим вам ссылку для восстановления пароля.
          </p>
        </div>

        <div className="relative z-10">
          {success ? (
            <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
              <CheckCircle2 className="text-green-500 w-12 h-12 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Ссылка отправлена</h3>
              <p className="text-sm text-gray-600 mb-6">Проверьте вашу почту {email}. Мы отправили инструкцию по восстановлению пароля.</p>
              <Link 
                href="/auth/login"
                className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm"
              >
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-bold text-slate-700">Email адрес</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="email" 
                    id="email" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-400 text-[15px]" 
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 text-[16px] flex items-center justify-center cursor-pointer" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
                </button>
              </div>

              <div className="text-center pt-4">
                <Link 
                  href="/auth/login" 
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Вернуться ко входу
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
