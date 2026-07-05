'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import { MoreVertical, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CabinetSettingsPage() {
  const { user } = useAuth();
  const isEmployer = user?.user_type === 'employer';
  
  // Tabs: 'team' (Сотрудники и доступы), 'security' (Безопасность)
  const [activeTab, setActiveTab] = useState<'team' | 'security'>(isEmployer ? 'team' : 'security');
  
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', repeatedPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchEmployees = async () => {
    if (!isEmployer) return;
    try {
      const res = await api.get('/api/companies/employees/');
      setEmployees(res.data.team || []);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };


  useEffect(() => {
    fetchEmployees();
  }, [isEmployer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.repeatedPassword) {
      toast.error('Новый пароль и подтверждение не совпадают.');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('Новый пароль должен содержать минимум 8 символов.');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/api/auth/change-password/', {
        current_password: form.oldPassword,
        new_password: form.newPassword,
        new_password_confirm: form.repeatedPassword,
      });
      toast.success('Пароль успешно изменён!');
      setForm({ oldPassword: '', newPassword: '', repeatedPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.old_password?.[0] || 'Ошибка при смене пароля.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;
    
    try {
      await api.post('/api/companies/employees/', inviteForm);
      toast.success(`Приглашение отправлено на ${inviteForm.email}`);
      setInviteForm({ name: '', email: '' });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при отправке приглашения');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Вы уверены, что хотите деактивировать аккаунт? Это действие нельзя отменить.')) return;
    setIsDeleting(true);
    try {
      await api.delete('/api/auth/account/', { data: { password: deletePassword } });
      toast.success('Аккаунт успешно деактивирован.');
      setTimeout(() => window.location.href = '/', 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при удалении аккаунта. Проверьте пароль.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Настройки аккаунта</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {isEmployer && (
            <button 
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-4 px-6 text-sm font-bold transition-colors ${activeTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Сотрудники и доступы
            </button>
          )}
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 px-6 text-sm font-bold transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Безопасность
          </button>
        </div>

        <div className="p-6 md:p-8">

          {activeTab === 'team' && isEmployer && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-bold text-slate-900 mb-4">HR сотрудники</h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-3 px-4 w-[30%]">ФИО</th>
                      <th className="py-3 px-4">Имейл</th>
                      <th className="py-3 px-4">Телефон</th>
                      <th className="py-3 px-4">Статус</th>
                      <th className="py-3 px-4">Роль</th>
                      <th className="py-3 px-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-medium text-slate-900">{user?.name || ''}</td>
                      <td className="py-4 px-4">{user?.email}</td>
                      <td className="py-4 px-4">{user?.company?.phone || '-'}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Владелец</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">Основной HR</span>
                      </td>
                      <td className="py-4 px-4 text-center"></td>
                    </tr>
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-900">{emp.name || ''}</td>
                        <td className="py-4 px-4">{emp.email}</td>
                        <td className="py-4 px-4">{emp.phone || '-'}</td>
                        <td className="py-4 px-4">
                          {emp.status === 'pending' ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Ожидает подтверждения</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Подтвержден</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <select 
                            value={emp.role} 
                            disabled={emp.status === 'pending'}
                            className="border border-slate-200 rounded-lg text-sm px-2 py-1 outline-none focus:border-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            <option value="hr_manager">HR Специалист</option>
                            <option value="recruiter">Рекрутер</option>
                            <option value="main_hr">Основной HR</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-sm font-semibold text-slate-700 whitespace-nowrap hidden sm:block">Добавить сотрудников</div>
                <input 
                  type="text" 
                  placeholder="Введите ФИО" 
                  required
                  value={inviteForm.name}
                  onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                  className="flex-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <input 
                  type="email" 
                  placeholder="Введите email" 
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  className="flex-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm">
                  Пригласить
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fadeIn">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Изменение пароля</h3>
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div className="form-group space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Текущий пароль</label>
                  <input
                    type="password"
                    required
                    value={form.oldPassword}
                    onChange={e => setForm({...form, oldPassword: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[15px]"
                  />
                </div>
                <div className="form-group space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Новый пароль</label>
                  <input
                    type="password"
                    required
                    value={form.newPassword}
                    onChange={e => setForm({...form, newPassword: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[15px]"
                  />
                </div>
                <div className="form-group space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Подтвердите новый пароль</label>
                  <input
                    type="password"
                    required
                    value={form.repeatedPassword}
                    onChange={e => setForm({...form, repeatedPassword: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-[15px]"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="mt-6 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {isLoading ? 'Сохранение...' : 'Обновить пароль'}
                </button>
              </form>
              
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-lg font-semibold text-rose-600 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Опасная зона
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-2xl">
                  Деактивация аккаунта скроет все ваши активные вакансии и резюме. Восстановить доступ можно будет только через службу поддержки. Для подтверждения введите ваш текущий пароль.
                </p>
                <form onSubmit={handleDeleteAccount} className="flex flex-col sm:flex-row items-end gap-4 max-w-lg">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Пароль для подтверждения</label>
                    <input
                      type="password"
                      required
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      className="w-full rounded-xl border border-rose-200 bg-rose-50/30 px-4 py-2.5 text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all text-sm"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isDeleting || !deletePassword}
                    className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    {isDeleting ? 'Удаление...' : 'Деактивировать аккаунт'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
