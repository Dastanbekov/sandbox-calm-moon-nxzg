'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';

export default function BillingPage() {
  const { user, updateBalance } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'online' | 'bank' | 'terminal'>('online');
  const [amount, setAmount] = useState('');
  
  const [bankForm, setBankForm] = useState({ name: '', post: '', INN: '', email: '', sum: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Mock Payment States
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockCardNumber, setMockCardNumber] = useState('4000 1234 5678 9010');
  const [mockExpiry, setMockExpiry] = useState('12/29');
  const [mockCvv, setMockCvv] = useState('123');
  const [mockLoading, setMockLoading] = useState(false);
  const [mockSuccess, setMockSuccess] = useState(false);

  useEffect(() => {
    if (user && user.user_type !== 'employer') {
      router.push('/cabinet');
    }
  }, [user, router]);

  const handleOnlinePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setShowMockModal(true);
    setMockSuccess(false);
    setMockLoading(false);
  };

  const triggerMockPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setMockLoading(true);
    setTimeout(() => {
      setMockLoading(false);
      setMockSuccess(true);
      updateBalance(parseFloat(amount));
      setTimeout(() => {
        setShowMockModal(false);
        setMockSuccess(false);
        setAmount('');
      }, 1500);
    }, 1500);
  };

  const handleBankPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/billing/payment/', { ...bankForm, type: 2 });
      setSuccess('Счет успешно выставлен и отправлен на ваш email.');
      setBankForm({ name: '', post: '', INN: '', email: '', sum: '' });
    } catch (err: any) {
      setError('Ошибка при выставлении счета');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.user_type !== 'employer') return null;

  return (
    <div className="tab-content w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div role="tabpanel" className="tab-pane fade in active bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Пополнение баланса</h2>
            <p className="text-slate-500 text-sm mt-1">Выберите удобный способ оплаты</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-2 self-start sm:self-auto">
            <span className="text-slate-600 text-sm font-medium">Текущий баланс:</span>
            <span className="text-lg font-bold text-[#4452c9]">{user.balance} KGS</span>
          </div>
        </div>

        <div className="categorys my-resumes space-y-6">
          
          <ul className="flex flex-wrap gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100 mb-6">
            <li className={`flex-1 min-w-[120px] text-center ${activeTab === 'online' ? 'active' : ''}`}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab('online'); }}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'online'
                    ? 'bg-white text-[#4452c9] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Онлайн оплата
              </a>
            </li>
            <li className={`flex-1 min-w-[120px] text-center ${activeTab === 'bank' ? 'active' : ''}`}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab('bank'); }}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'bank'
                    ? 'bg-white text-[#4452c9] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Безналичный расчет
              </a>
            </li>
            <li className={`flex-1 min-w-[120px] text-center ${activeTab === 'terminal' ? 'active' : ''}`}>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setActiveTab('terminal'); }}
                className={`block py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === 'terminal'
                    ? 'bg-white text-[#4452c9] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Терминал / Кошелек
              </a>
            </li>
          </ul>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs">
            {activeTab === 'online' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Введите сумму платежа</h3>
                <form onSubmit={handleOnlinePay} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-lg mt-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Сумма пополнения</label>
                    <div className="relative rounded-xl shadow-xs">
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-16 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px]"
                        placeholder="Сумма"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <span className="text-slate-500 font-medium text-sm">KGS</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="bg-[#4452c9] hover:bg-[#3642a8] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-[15px] flex items-center justify-center cursor-pointer whitespace-nowrap h-[48px]"
                  >
                    Перейти к оплате
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Заполните реквизиты вашей организации</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Мы выставим Вам счет на оплату указывая ваши реквизиты и незамедлительно отправим отсканированный вариант счета на Ваш электронный адрес.</p>
                </div>
                
                {success && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[15px] flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{success}</span>
                  </div>
                )}
                {error && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[15px] flex items-center gap-3">
                    <svg className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleBankPay} className="space-y-4 max-w-lg mt-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Название юридич. лица</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.name} 
                      onChange={e => setBankForm(f => ({...f, name: e.target.value}))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Почтовый адрес</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.post} 
                      onChange={e => setBankForm(f => ({...f, post: e.target.value}))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">ИНН</label>
                    <input 
                      type="text" 
                      required 
                      value={bankForm.INN} 
                      onChange={e => setBankForm(f => ({...f, INN: e.target.value}))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">E-mail (для отправки счетов)</label>
                    <input 
                      type="email" 
                      required 
                      value={bankForm.email} 
                      onChange={e => setBankForm(f => ({...f, email: e.target.value}))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Сумма (KGS)</label>
                    <input 
                      type="number" 
                      required 
                      value={bankForm.sum} 
                      onChange={e => setBankForm(f => ({...f, sum: e.target.value}))} 
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-[16px] flex items-center justify-center cursor-pointer mt-2" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Отправка...' : 'Отправить запрос'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Оплата через терминал / кошелек</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Оплатить можно через терминалы или мобильный кошелек, найдя <strong className="text-slate-900 font-semibold">employment.kg</strong> в разделе "Объявления" или "Услуги".
                </p>
                <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside bg-slate-50 border border-slate-100 rounded-xl p-4 md:p-6">
                  <li>Найдите терминал (Pay24, О!, MegaPay и др.)</li>
                  <li>Выберите раздел <span className="font-semibold text-slate-800">"Объявления"</span></li>
                  <li>Найдите <span className="font-semibold text-slate-800">employment.kg</span></li>
                  <li>Введите ваш лицевой счет (ID пользователя: <strong className="text-[#4452c9] font-bold">{user.id}</strong>)</li>
                  <li>Внесите оплату</li>
                </ol>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-slate-500 m-0">
              <strong className="text-slate-700 font-semibold">ОсОО “Эмплоймент.кг”</strong> | ИНН: 02804201610481 | Телефон: +996 772 267 490
            </p>
          </div>

        </div>
      </div>

      {/* Mock Credit Card Modal Dialog */}
      {showMockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 relative">
            <button 
              onClick={() => setShowMockModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              disabled={mockLoading}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {mockSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 animate-pulse">Оплата успешна!</h3>
                <p className="text-sm text-slate-500">Баланс успешно пополнен на <strong className="text-[#4452c9]">{amount} KGS</strong>.</p>
              </div>
            ) : mockLoading ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-t-[#4452c9] border-slate-100 rounded-full animate-spin mx-auto"></div>
                <h3 className="text-lg font-semibold text-slate-900">Проведение платежа...</h3>
                <p className="text-sm text-slate-500">Пожалуйста, подождите, мы авторизуем транзакцию.</p>
              </div>
            ) : (
              <form onSubmit={triggerMockPayment} className="space-y-4">
                <div className="text-center pb-2">
                  <h3 className="text-xl font-bold text-slate-900">Демонстрационный платеж</h3>
                  <p className="text-sm text-slate-500 mt-1">Имитация оплаты картой на сумму <strong className="text-[#4452c9]">{amount} KGS</strong></p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Номер карты</label>
                  <input 
                    type="text" 
                    required 
                    value={mockCardNumber} 
                    onChange={e => setMockCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all text-center text-lg font-medium tracking-widest shadow-xs" 
                    placeholder="4000 1234 5678 9010"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Срок действия</label>
                    <input 
                      type="text" 
                      required 
                      value={mockExpiry} 
                      onChange={e => setMockExpiry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all text-center text-[15px] shadow-xs" 
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">CVC / CVV</label>
                    <input 
                      type="password" 
                      maxLength={3}
                      required 
                      value={mockCvv} 
                      onChange={e => setMockCvv(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all text-center text-[15px] shadow-xs" 
                      placeholder="***"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#4452c9] hover:bg-[#3642a8] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg text-[15px] flex items-center justify-center cursor-pointer mt-4"
                >
                  Оплатить {amount} KGS
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
