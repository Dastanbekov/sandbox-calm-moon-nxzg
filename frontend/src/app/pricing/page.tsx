'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { CheckCircle2, Star, Zap, Building2, Crown, ArrowRight, ShieldCheck, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Тарифы из бэкенда (BILLING_RATES)
  const plans = [
    {
      id: 'basic',
      action: null,
      type: 'vacancy',
      duration: 0,
      title: 'Базовый',
      price: 'Бесплатно',
      priceNumeric: 0,
      icon: <Building2 className="w-8 h-8 text-slate-400" />,
      features: [
        'Размещение вакансий (оплата за каждую)',
        'Ограниченный доступ к базе резюме',
        'Просмотр контактов (от 150 KGS/шт)',
        'Базовая поддержка'
      ],
      buttonText: 'Текущий тариф',
      popular: false,
      isCurrent: !user?.company?.super_hr_type,
    },
    {
      id: 'superHr',
      action: 'superHr',
      type: 'company',
      duration: 30, // берем тариф на 30 дней (6800 KGS)
      title: 'Super HR',
      price: '6 800 KGS',
      priceSubtitle: 'в месяц',
      priceNumeric: 6800,
      icon: <Star className="w-8 h-8 text-blue-500" />,
      features: [
        'Безлимитное размещение вакансий',
        'Снятие ограничений с 50 резюме/мес',
        'Доступ к скрытым контактным данным',
        'Приоритетная поддержка 24/7'
      ],
      buttonText: 'Подключить Super HR',
      popular: true,
      isCurrent: user?.company?.super_hr_type === 'superHr',
    },
    {
      id: 'superHrPlus',
      action: 'superHrPlus',
      type: 'company',
      duration: 30, // тариф на 30 дней (13600 KGS)
      title: 'Super HR Plus',
      price: '13 600 KGS',
      priceSubtitle: 'в месяц',
      priceNumeric: 13600,
      icon: <Crown className="w-8 h-8 text-amber-500" />,
      features: [
        'Всё из пакета Super HR',
        'Снятие ограничений с 100 резюме/мес',
        'Авто-выделение вакансий в поиске',
        'Брендирование страницы компании',
        'Персональный менеджер'
      ],
      buttonText: 'Подключить Plus',
      popular: false,
      isCurrent: user?.company?.super_hr_type === 'superHrPlus',
    }
  ];

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      toast.error('Пожалуйста, авторизуйтесь для покупки тарифа');
      router.push('/auth/login');
      return;
    }
    
    if (user.user_type !== 'employer') {
      toast.error('Тарифы доступны только работодателям');
      return;
    }

    if (plan.isCurrent) return;

    if (!plan.action) return;

    const currentBalance = parseFloat(user.balance?.toString() || '0');
    if (currentBalance < plan.priceNumeric) {
      toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-slate-800">Недостаточно средств</span>
          <span className="text-sm text-slate-600">На вашем балансе {currentBalance} KGS. Для покупки нужно {plan.priceNumeric} KGS.</span>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                router.push('/cabinet/billing');
              }}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Пополнить баланс
            </button>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200"
            >
              Отмена
            </button>
          </div>
        </div>
      ), { duration: 6000 });
      return;
    }

    if (!confirm(`Подтверждаете покупку тарифа "${plan.title}" за ${plan.priceNumeric} KGS? Сумма будет списана с вашего баланса.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // POST /api/billing/{action}/{id}/
      // Для тарифов компании id = 0 или company.id (бэкенд обрабатывает billable_id=0 как None)
      await api.post(`/api/billing/${plan.action}/0/`, {
        type: plan.type,
        duration: plan.duration
      });
      toast.success(`Тариф "${plan.title}" успешно активирован! Обновите страницу.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Ошибка при покупке тарифа');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Тарифы для <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">успешного найма</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Выберите оптимальный тарифный план для вашей компании. Открывайте скрытые контакты резюме, публикуйте больше вакансий и находите лучших кандидатов быстрее.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white rounded-3xl border flex flex-col transition-all duration-300 ${
                plan.popular 
                  ? 'border-blue-200 shadow-2xl shadow-blue-900/10 scale-105 z-10' 
                  : 'border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-blue-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Zap size={14} fill="currentColor" />
                    Популярный выбор
                  </span>
                </div>
              )}
              
              <div className="p-8 border-b border-slate-100 text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-2xl ${plan.popular ? 'bg-blue-50' : 'bg-slate-50'}`}>
                    {plan.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.title}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                  {plan.priceSubtitle && <span className="text-slate-500 font-medium ml-2">{plan.priceSubtitle}</span>}
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.popular ? 'text-blue-500' : 'text-emerald-500'}`} />
                      <span className="text-slate-600 font-medium leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={plan.isCurrent || isProcessing || plan.id === 'basic'}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                    ${plan.isCurrent 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' 
                      : plan.id === 'basic'
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg shadow-blue-600/20 active:scale-[0.98]'
                          : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-[0.98]'
                    }
                  `}
                >
                  {plan.isCurrent ? (
                    <>
                      <ShieldCheck size={20} />
                      Активный тариф
                    </>
                  ) : (
                    <>
                      {plan.buttonText}
                      {plan.id !== 'basic' && <ArrowRight size={18} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Инструкция по пополнению баланса */}
        <div className="max-w-4xl mx-auto mt-20 bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Как оплатить тариф?</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">1</div>
                <p className="text-slate-600 pt-1">Пополните внутренний баланс в <Link href="/cabinet/billing" className="text-blue-600 font-medium hover:underline">Личном кабинете</Link> через онлайн-шлюз PayBox (картой) или запросив счет на оплату.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">2</div>
                <p className="text-slate-600 pt-1">Вернитесь на эту страницу и нажмите &quot;Подключить&quot;. Сумма тарифа спишется с вашего баланса автоматически.</p>
              </div>
            </div>
          </div>
          <div className="md:w-1/3 w-full">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white text-center">
              <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <div className="text-sm text-slate-400 mb-1">Ваш текущий баланс</div>
              <div className="text-3xl font-black mb-4">{user?.balance || 0} <span className="text-lg">KGS</span></div>
              <Link href="/cabinet/billing" className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-colors">
                Пополнить
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
