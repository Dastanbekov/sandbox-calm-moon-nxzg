'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { 
  CreditCard, 
  Building2, 
  Smartphone,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  History,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function BillingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'paybox' | 'bank' | 'terminal'>('paybox');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/billing/history/');
        setHistory(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch billing history:', error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handlePayboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    try {
      // Инициализируем платеж на бекенде
      const response = await api.post('/api/billing/paybox/init/', {
        amount: amount,
        type: 'Банковские карты'
      });
      
      const { url, params } = response.data;
      
      // Создаем скрытую форму и сабмитим ее на шлюз PayBox
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      
      for (const key in params) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
      }
      
      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Paybox init failed:', error);
      alert('Ошибка при инициализации платежа. Попробуйте позже.');
    }
  };

  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankSuccess, setBankSuccess] = useState('');
  const [bankInn, setBankInn] = useState('');
  const [bankAmount, setBankAmount] = useState('');

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSubmitting(true);
    try {
      await api.post('/api/billing/invoice-request/', {
        inn: bankInn,
        amount: bankAmount,
        email: user?.email,
      });
      setBankSuccess('Заявка отправлена. Менеджер свяжется с вами в течение 1 рабочего дня.');
    } catch {
      setBankSuccess('Ошибка при отправке заявки. Напишите нам на почту.');
    } finally {
      setBankSubmitting(false);
    }
  };

  if (!user || user.user_type !== 'employer') return null;

  return (
    <div className="p-8 animate-fadeIn max-w-[1200px]">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Финансы и биллинг</h1>
        <p className="text-gray-500 font-medium">Управление балансом и история операций</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <Wallet size={32} className="text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 font-medium mb-1">Ваш текущий баланс</p>
              <h2 className="text-4xl font-black">{user.balance || 0} <span className="text-xl text-gray-500">KGS</span></h2>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-sm backdrop-blur-sm">
            <p className="text-sm text-gray-300 font-medium flex items-center gap-2 mb-1">
              <Info size={16} className="text-blue-400" /> Тарификация
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Средства с баланса расходуются на публикацию премиум-вакансий, покупку пакетов резюме и продвижение.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Up Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Пополнить баланс</h3>
          </div>
          
          <div className="flex border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('paybox')}
              className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'paybox' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <CreditCard size={20} /> Онлайн оплата
            </button>
            <button 
              onClick={() => setActiveTab('bank')}
              className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'bank' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Building2 size={20} /> Счет на оплату
            </button>
            <button 
              onClick={() => setActiveTab('terminal')}
              className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === 'terminal' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Smartphone size={20} /> Терминалы
            </button>
          </div>

          <div className="p-6 flex-1 bg-white">
            {activeTab === 'paybox' && (
              <form onSubmit={handlePayboxSubmit} className="space-y-6 animate-fadeIn">
                <p className="text-sm text-gray-500">Пополнение баланса картами Visa, MasterCard, Элкарт через защищенный шлюз PayBox.</p>
                <div>
                  <label className="text-sm font-bold text-gray-900 block mb-2">Сумма пополнения (KGS)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Например: 5000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-lg font-medium outline-none transition-all"
                    required
                    min="100"
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
                  Перейти к оплате
                </button>
              </form>
            )}

            {activeTab === 'bank' && (
              <form onSubmit={handleBankSubmit} className="space-y-4 animate-fadeIn">
                <p className="text-sm text-gray-500 mb-2">Запросите счет на оплату для юр. лиц. Мы подготовим закрывающие документы.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">ИНН Компании</label>
                    <input type="text" value={bankInn} onChange={e => setBankInn(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Сумма (KGS)</label>
                    <input type="number" value={bankAmount} onChange={e => setBankAmount(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email для документов</label>
                  <input type="email" defaultValue={user.email} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500" required />
                </div>
                {bankSuccess && <p className="text-sm text-green-600 font-medium">{bankSuccess}</p>}
                <button type="submit" disabled={bankSubmitting} className="w-full mt-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {bankSubmitting ? 'Отправка...' : 'Запросить счет'}
                </button>
              </form>
            )}

            {activeTab === 'terminal' && (
              <div className="space-y-4 animate-fadeIn text-center flex flex-col items-center justify-center h-full py-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
                  <Smartphone size={32} />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Код для терминалов</h4>
                <div className="bg-gray-100 px-6 py-3 rounded-xl">
                  <span className="text-2xl font-black text-gray-900 tracking-widest">{user.id?.toString().padStart(6, '0')}</span>
                </div>
                <p className="text-sm text-gray-500 max-w-[250px]">
                  Используйте этот код для пополнения через терминалы Pay24, Umai, O!Деньги.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History size={20} className="text-gray-400" /> История операций
            </h3>
            <button className="text-gray-500 hover:text-gray-900 transition-colors p-1" title="Распечатать выписку">
              <Printer size={18} />
            </button>
          </div>
          
          <div className="p-0 overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Загрузка...</div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">История пуста</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {item.type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <div className={`font-black whitespace-nowrap ${
                      item.type === 'in' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {item.type === 'in' ? '+' : ''}{item.amount} KGS
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
