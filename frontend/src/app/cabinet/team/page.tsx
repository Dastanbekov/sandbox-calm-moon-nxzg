'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Users, UserPlus, Mail, Shield, CheckCircle2, Clock, Trash2, Save, X, Edit3, User } from 'lucide-react';
import { api } from '@/services/auth.service';
import toast from 'react-hot-toast';

interface TeamMember {
  id: number | 'owner';
  user_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: 'active' | 'pending';
}

export default function TeamPage() {
  const { user } = useAuth();
  
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('hr_manager');
  const [isInviting, setIsInviting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | 'owner' | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get('/api/companies/employees/');
      setTeam(res.data.team);
      setIsOwner(res.data.is_owner);
    } catch (err: any) {
      setError('Ошибка при загрузке команды');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const res = await api.post('/api/companies/employees/', {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole
      });
      // Add new member to list
      setTeam(prev => [...prev, res.data]);
      setIsModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      toast.success('Приглашение отправлено');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при добавлении');
    } finally {
      setIsInviting(false);
    }
  };

  const startEdit = (member: TeamMember) => {
    if (!isOwner && member.id !== 'owner') return; // Only owner can edit others
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      phone: member.phone || '',
      role: member.role
    });
  };

  const handleSave = async (id: number | 'owner') => {
    if (id === 'owner') {
      setEditingId(null);
      return; // Can't edit owner through this endpoint currently if it's just self, but wait!
    }
    
    setIsSaving(true);
    try {
      const res = await api.patch('/api/companies/employees/', {
        id,
        ...editForm
      });
      
      if (editForm.role === 'main_hr') {
        // Ownership transferred. We should reload the page to get new state.
        toast.success('Вы передали права Главного HR другому сотруднику.');
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      setTeam(prev => prev.map(m => m.id === id ? { ...m, ...editForm } as TeamMember : m));
      setEditingId(null);
      toast.success('Данные сохранены');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number | 'owner') => {
    if (id === 'owner') return;
    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) return;
    
    try {
      await api.delete(`/api/companies/employees/?id=${id}`);
      setTeam(prev => prev.filter(m => m.id !== id));
      toast.success('Сотрудник удален');
    } catch (err: any) {
      toast.error('Ошибка при удалении');
    }
  };

  const getRoleLabel = (roleStr: string) => {
    switch (roleStr) {
      case 'main_hr': return 'Основной HR';
      case 'hr_manager': return 'HR-менеджер';
      case 'recruiter': return 'Рекрутер';
      default: return roleStr;
    }
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              HR-пользователи
            </h1>
            <p className="text-gray-500 text-sm mt-1">Управление командой рекрутеров вашей компании</p>
          </div>
          {isOwner && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Пригласить HR
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Current Team List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-[35%] min-w-[250px]">Сотрудник (ФИО и Телефон)</th>
                  <th className="p-4 w-[20%]">Email</th>
                  <th className="p-4 w-[15%]">Роль</th>
                  <th className="p-4 w-[15%]">Статус</th>
                  {isOwner && <th className="p-4 pr-6 text-right w-[15%]">Действия</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.map((member) => {
                  const isEditing = editingId === member.id;
                  const isMainHr = member.role === 'main_hr' || member.id === 'owner';

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-start">
                          <div className={`h-10 w-10 mt-1 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isMainHr ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {member.name ? member.name.charAt(0).toUpperCase() : <User size={18} />}
                          </div>
                          <div className="ml-4 flex-1">
                            {isEditing && member.id !== 'owner' ? (
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  value={editForm.name} 
                                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                                  placeholder="ФИО"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <input 
                                  type="text" 
                                  value={editForm.phone || ''} 
                                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                  placeholder="Телефон"
                                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-medium text-gray-900">{member.name || 'Без имени'}</div>
                                <div className="text-sm text-gray-500 mt-0.5">{member.phone || 'Телефон не указан'}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate" title={member.email}>{member.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {isEditing && member.id !== 'owner' ? (
                          <select 
                            value={editForm.role}
                            onChange={e => setEditForm({...editForm, role: e.target.value})}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="hr_manager">HR-менеджер</option>
                            <option value="recruiter">Рекрутер</option>
                            <option value="main_hr">Основной HR (передать права)</option>
                          </select>
                        ) : (
                          <div className="flex items-center text-sm text-gray-900 font-medium">
                            {isMainHr && <Shield className="w-4 h-4 mr-1.5 text-blue-500" />}
                            {getRoleLabel(member.role)}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {member.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Подтвержден
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1" /> Ожидает
                          </span>
                        )}
                      </td>
                      {isOwner && (
                        <td className="p-4 pr-6 text-right">
                          {member.id !== 'owner' && (
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSave(member.id)} disabled={isSaving} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Сохранить">
                                    <Save className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors" title="Отмена">
                                    <X className="w-5 h-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(member)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Редактировать">
                                    <Edit3 className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleDelete(member.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Удалить">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                
                {team.length === 1 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center bg-gray-50/50">
                      <div className="mx-auto w-12 h-12 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">Добавьте коллег</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                        Пригласите других HR-специалистов, чтобы вместе работать над поиском кандидатов и управлением откликами.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Пригласить сотрудника</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ФИО</label>
                <input 
                  type="text" 
                  required 
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input 
                  type="email" 
                  required 
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Роль</label>
                <select 
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  <option value="hr_manager">HR-менеджер</option>
                  <option value="recruiter">Рекрутер</option>
                </select>
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={isInviting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isInviting ? 'Отправка...' : 'Пригласить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
