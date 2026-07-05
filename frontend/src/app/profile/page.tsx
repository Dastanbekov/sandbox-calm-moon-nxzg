'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User as UserIcon, 
  Users,
  Briefcase, 
  FileText, 
  History, 
  Bell, 
  Settings, 
  Plus, 
  ChevronRight, 
  ArrowUpRight, 
  Trash, 
  Check, 
  AlertCircle,
  Eye,
  Mail,
  Phone,
  BookOpen
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { vacanciesService } from '@/services/vacancies.service';
import { resumesService } from '@/services/resumes.service';
import { lookupsService } from '@/services/lookups.service';
import { Vacancy, Resume, Lookups, User } from '@/types';
import styles from './page.module.css';

// Type definition for transaction logs
interface Transaction {
  id: string;
  description: string;
  change: number;
  balance: number;
  created_at: string;
}

export default function ProfileDashboard() {
  const router = useRouter();
  
  // Profile Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'resumes' | 'subscriptions' | 'vacancies' | 'responses' | 'history'>('settings');

  // Lookups data
  const [lookups, setLookups] = useState<Lookups | null>(null);

  // Candidate Data State
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [editingResume, setEditingResume] = useState<Partial<Resume> | null>(null);

  // Employer Data State
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [vacancyStatusTab, setVacancyStatusTab] = useState<'published' | 'checking' | 'archives' | 'drafts'>('published');
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Partial<Vacancy> | null>(null);

  // Billing & Top-up State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx_101',
      description: 'Пополнение баланса FreedomPay Visa/Mastercard',
      change: 2000,
      balance: 2000,
      created_at: '2026-05-20T14:30:00Z'
    }
  ]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMethod, setTopupMethod] = useState('card');

  // Offline Warning indicator
  const [isOffline, setIsOffline] = useState(false);

  // Form Fields
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    companyTitle: '',
    aboutCompany: '',
    site: ''
  });

  // Resume Form State
  const [resumeForm, setResumeForm] = useState({
    career_objective: '',
    salary: '',
    city: '',
    scope: '',
    busyness: '',
    key_skills: '',
    about_me: ''
  });

  // Vacancy Form State
  const [vacancyForm, setVacancyForm] = useState({
    position: '',
    wages_from: '',
    wages_to: '',
    city: '',
    scope: '',
    busyness: '',
    experience: '',
    overview: '',
    qualification_requirements: '',
    duties: '',
    conditions: ''
  });

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Set current active user balance
    setCurrentUser(user);
    setProfileForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.profile?.phone || user.company?.phone || '',
      city: user.profile?.address || user.company?.address || '',
      address: user.profile?.address || user.company?.address || '',
      companyTitle: user.company?.title || '',
      aboutCompany: user.company?.about_company || '',
      site: user.company?.site || ''
    });

    // Determine initial tab based on role
    if (user.company) {
      setActiveTab('vacancies');
    } else {
      setActiveTab('resumes');
    }

    setLoading(false);

    // Load consolidated lookups
    lookupsService.getLookups()
      .then(setLookups)
      .catch(() => console.warn('Offline: Lookups failed to load in cabinet.'));

    // Check transaction history from local storage if existing
    const cachedTx = localStorage.getItem('profile_transactions');
    if (cachedTx) {
      setTransactions(JSON.parse(cachedTx));
    }
  }, [router]);

  // Load user resumes
  useEffect(() => {
    if (currentUser && !currentUser.company && activeTab === 'resumes') {
      setResumesLoading(true);
      resumesService.getCabinetResumes()
        .then(response => {
          setResumes(response.results);
          setResumesLoading(false);
          setIsOffline(false);
        })
        .catch(() => {
          setIsOffline(true);
          setResumesLoading(false);
        });
    }
  }, [currentUser, activeTab]);

  // Load user vacancies
  useEffect(() => {
    if (currentUser && currentUser.company && activeTab === 'vacancies') {
      setVacanciesLoading(true);
      vacanciesService.getCabinetVacancies(vacancyStatusTab)
        .then(response => {
          setVacancies(response.results);
          setVacanciesLoading(false);
          setIsOffline(false);
        })
        .catch(() => {
          setIsOffline(true);
          setVacanciesLoading(false);
        });
    }
  }, [currentUser, activeTab, vacancyStatusTab]);

  // Profile Form submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Simulate profile update locally
    const updatedUser: User = {
      ...currentUser,
      name: profileForm.name,
      email: profileForm.email,
      profile: currentUser.profile ? {
        ...currentUser.profile,
        phone: profileForm.phone,
        address: profileForm.address
      } : {
        id: Date.now(),
        phone: profileForm.phone,
        show_phone: true,
        address: profileForm.address,
        name: profileForm.name,
        sname: null,
        photo: null
      },
      company: currentUser.company ? {
        ...currentUser.company,
        title: profileForm.companyTitle,
        about_company: profileForm.aboutCompany,
        site: profileForm.site
      } : undefined
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    showToast('Настройки профиля успешно обновлены.', 'success');
  };

  // Balance top up simulation
  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !topupAmount) return;

    const amount = Number(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Введите корректную сумму пополнения', 'error');
      return;
    }

    const updatedUser = {
      ...currentUser,
      balance: Number(currentUser.balance) + amount
    };

    // Update localStorage user object
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    // Save transaction log
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      description: `Пополнение баланса через ${topupMethod === 'card' ? 'Банковскую карту' : topupMethod === 'mobilnik' ? 'Мобильник' : 'Элкарт'}`,
      change: amount,
      balance: updatedUser.balance,
      created_at: new Date().toISOString()
    };

    const newTxList = [newTx, ...transactions];
    setTransactions(newTxList);
    localStorage.setItem('profile_transactions', JSON.stringify(newTxList));

    setShowTopupModal(false);
    setTopupAmount('');
    showToast(`Баланс успешно пополнен на ${amount} KGS.`, 'success');
  };

  // Vacancy Action handlers (Publish, Archive, Delete)
  const handlePublishVacancy = async (id: number) => {
    if (!currentUser) return;

    try {
      // Calls actual endpoint
      const response = await vacanciesService.publishVacancy(id);
      showToast(response.detail, 'success');
      
      // Update local listing
      setVacancies(prev => prev.filter(v => v.id !== id));
      
      // Deduct balance locally if simulated
      if (isOffline) {
        deductLocalBalance(720, `Публикация вакансии #${id}`);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || 'Не удалось опубликовать вакансию.';
      
      if (isOffline) {
        if (Number(currentUser.balance) >= 720) {
          deductLocalBalance(720, `Публикация вакансии #${id}`);
          setVacancies(prev => prev.map(v => v.id === id ? { ...v, draft: false, moderated: true } : v));
          showToast('Вакансия успешно отправлена на публикацию!', 'success');
        } else {
          showToast('Недостаточно средств на балансе. Требуется 720 KGS для публикации.', 'error');
        }
      } else {
        showToast(errMsg, 'error');
      }
    }
  };

  const deductLocalBalance = (amount: number, desc: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      balance: Number(currentUser.balance) - amount
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      description: desc,
      change: -amount,
      balance: updatedUser.balance,
      created_at: new Date().toISOString()
    };
    const newTxList = [newTx, ...transactions];
    setTransactions(newTxList);
    localStorage.setItem('profile_transactions', JSON.stringify(newTxList));
  };

  const handleDeleteVacancy = async (id: number) => {
    if (!confirm('Вы действительно хотите архивировать/удалить эту вакансию?')) return;
    try {
      await vacanciesService.deleteVacancy(id);
      setVacancies(prev => prev.filter(v => v.id !== id));
      showToast('Вакансия удалена.', 'success');
    } catch {
      setVacancies(prev => prev.filter(v => v.id !== id));
      showToast('Вакансия архивирована локально.', 'success');
    }
  };

  const handleCreateOrEditVacancy = (e: React.FormEvent) => {
    e.preventDefault();
    
    const salaryFrom = Number(vacancyForm.wages_from);
    const salaryTo = Number(vacancyForm.wages_to);

    const newVacancyData: Partial<Vacancy> = {
      position: vacancyForm.position,
      wages_from: isNaN(salaryFrom) ? undefined : salaryFrom,
      wages_to: isNaN(salaryTo) ? undefined : salaryTo,
      overview: vacancyForm.overview,
      qualification_requirements: vacancyForm.qualification_requirements,
      duties: vacancyForm.duties,
      conditions: vacancyForm.conditions,
      experience: vacancyForm.experience,
      anonim: false,
      draft: true,
      moderated: false,
      archive: false,
      company: { id: currentUser?.company?.id || null, title: currentUser?.company?.title || 'Компания', logo: null }
    };

    if (editingVacancy?.id) {
      vacanciesService.updateVacancy(editingVacancy.id, newVacancyData)
        .then(() => {
          showToast('Вакансия успешно обновлена.', 'success');
          setShowVacancyModal(false);
          router.refresh();
        })
        .catch(() => {
          showToast('Вакансия обновлена локально (демо)', 'success');
          setShowVacancyModal(false);
        });
    } else {
      vacanciesService.createVacancy(newVacancyData)
        .then(() => {
          showToast('Черновик вакансии успешно создан. Не забудьте опубликовать её.', 'success');
          setShowVacancyModal(false);
        })
        .catch(() => {
          // Offline mock creation
          const mockId = Date.now();
          const mockV: Vacancy = {
            id: mockId,
            position: vacancyForm.position,
            wages_from: salaryFrom,
            wages_to: salaryTo,
            overview: vacancyForm.overview,
            city_detail: { id: 1, title: 'Бишкек', active: true },
            busyness_detail: { id: 1, title: 'Полная занятость', active: true },
            company: { id: 1, title: currentUser?.company?.title || 'Наша компания', logo: null },
            count_view: 0,
            count_response: 0,
            draft: true,
            moderated: false,
            archive: false,
            response_email_notifications: true,
            only_in_english: false,
            is_fixed: false,
            is_hot: false,
            in_priority: false,
            upped: false,
            anonim: false
          };
          setVacancies([mockV, ...vacancies]);
          showToast('Черновик вакансии успешно создан (демо)', 'success');
          setShowVacancyModal(false);
        });
    }
  };

  // Resume actions handlers
  const handleCreateOrEditResume = (e: React.FormEvent) => {
    e.preventDefault();

    const expectedSalary = Number(resumeForm.salary);

    const newResumeData: Partial<Resume> = {
      career_objective: resumeForm.career_objective,
      salary: isNaN(expectedSalary) ? undefined : expectedSalary,
      key_skills: resumeForm.key_skills,
      about_me: resumeForm.about_me,
      draft: false,
      moderated: true,
      has_contact_access: false,
      is_fixed: false,
      is_hot: false,
      is_hidden: false,
      work_experiences: [],
      institutions: [],
      extra_institutions: [],
      resume_languages: []
    };

    if (editingResume?.id) {
      resumesService.updateResume(editingResume.id, newResumeData)
        .then(() => {
          showToast('Резюме успешно обновлено.', 'success');
          setShowResumeModal(false);
        })
        .catch(() => {
          showToast('Резюме обновлено локально (демо)', 'success');
          setShowResumeModal(false);
        });
    } else {
      resumesService.createResume(newResumeData)
        .then(() => {
          showToast('Резюме успешно создано.', 'success');
          setShowResumeModal(false);
        })
        .catch(() => {
          // Offline mock creation
          const mockId = Date.now();
          const mockR: Resume = {
            id: mockId,
            position: resumeForm.career_objective,
            career_objective: resumeForm.career_objective,
            salary: expectedSalary,
            city_detail: { id: 1, title: 'Бишкек', active: true },
            busyness_detail: { id: 1, title: 'Полная занятость', active: true },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            has_contact_access: false,
            is_fixed: false,
            is_hot: false,
            draft: false,
            moderated: true,
            is_hidden: false,
            work_experiences: [],
            institutions: [],
            extra_institutions: [],
            resume_languages: []
          };
          setResumes([mockR, ...resumes]);
          showToast('Резюме успешно создано (демо)', 'success');
          setShowResumeModal(false);
        });
    }
  };

  const handleDeleteResume = async (id: number) => {
    if (!confirm('Вы действительно хотите удалить это резюме?')) return;
    try {
      await resumesService.deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      showToast('Резюме успешно удалено.', 'success');
    } catch {
      setResumes(prev => prev.filter(r => r.id !== id));
      showToast('Резюме удалено локально.', 'success');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>Загрузка личного кабинета...</div>
      </div>
    );
  }

  if (!currentUser) return null;

  const isEmployer = !!currentUser.company;

  return (
    <div className={styles.container}>
      <h1 className={styles.tabTitle}>Личный кабинет</h1>

      {isOffline && (
        <div className={styles.warningBanner}>
          <span className={styles.warningBannerTitle}>⚠️ Демонстрационный офлайн-режим</span>
          <span>База данных PostgreSQL отключена. Вы можете управлять резюме, вакансиями и совершать виртуальные платежи локально.</span>
        </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.profileLayout}>
        {/* Sidebar Info Panels */}
        <aside className={styles.sidebar}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {currentUser.name ? currentUser.name.substring(0, 2).toUpperCase() : <UserIcon className="w-6 h-6" />}
            </div>
            <div>
              <div className={styles.userName}>{currentUser.name}</div>
              <div className={styles.userEmail}>{currentUser.email}</div>
            </div>
          </div>

          <div className={styles.balancePanel}>
            <span className={styles.balanceTitle}>Текущий баланс</span>
            <span className={styles.balanceVal}>{Number(currentUser.balance).toLocaleString()} KGS</span>
            {currentUser.personal_bill && (
              <span className={styles.billNum}>Лицевой счет: #{currentUser.personal_bill}</span>
            )}
            <button className={styles.btnTopup} onClick={() => setShowTopupModal(true)}>
              <ArrowUpRight className="w-4 h-4 inline mr-1" /> Пополнить баланс
            </button>
          </div>

          <nav className={styles.navTabs}>
            <button 
              className={`${styles.tabLink} ${activeTab === 'settings' ? styles.tabLinkActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4" /> Настройки профиля
            </button>
            <Link href="/cabinet/settings" className={styles.tabLink}>
              <Settings className="w-4 h-4" /> Смена пароля
            </Link>

            {!isEmployer ? (
              <>
                <button 
                  className={`${styles.tabLink} ${activeTab === 'resumes' ? styles.tabLinkActive : ''}`}
                  onClick={() => setActiveTab('resumes')}
                >
                  <FileText className="w-4 h-4" /> Мои резюме
                </button>
                <Link href="/cabinet/responses" className={styles.tabLink}>
                  <Users className="w-4 h-4" /> Мои отклики
                </Link>
                <Link href="/cabinet/saved-vacancies" className={styles.tabLink}>
                  <FileText className="w-4 h-4" /> Сохраненные вакансии
                </Link>
                <Link href="/cabinet/training-responses" className={styles.tabLink}>
                  <FileText className="w-4 h-4" /> Заявки на тренинги
                </Link>
                <Link href="/cabinet/subscribes" className={styles.tabLink}>
                  <Bell className="w-4 h-4" /> Подписки на вакансии
                </Link>
              </>
            ) : (
              <>
                <button 
                  className={`${styles.tabLink} ${activeTab === 'vacancies' ? styles.tabLinkActive : ''}`}
                  onClick={() => setActiveTab('vacancies')}
                >
                  <Briefcase className="w-4 h-4" /> Мои вакансии
                </button>
                <Link href="/cabinet/responses" className={styles.tabLink}>
                  <Users className="w-4 h-4" /> Отклики кандидатов
                </Link>
                <Link href="/cabinet/saved-resumes" className={styles.tabLink}>
                  <FileText className="w-4 h-4" /> Сохраненные резюме
                </Link>
                <Link href="/cabinet/trainings" className={styles.tabLink}>
                  <BookOpen className="w-4 h-4" /> Мои тренинги
                </Link>
                <Link href="/cabinet/training-responses" className={styles.tabLink}>
                  <FileText className="w-4 h-4" /> Заявки на тренинги
                </Link>
                <Link href="/billing" className={styles.tabLink}>
                  <ArrowUpRight className="w-4 h-4" /> Пополнить баланс
                </Link>
                <Link href="/billing/history" className={styles.tabLink}>
                  <History className="w-4 h-4" /> История платежей
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Tab contents panel */}
        <main className={styles.mainContent}>
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className={styles.tabTitle}>Настройки аккаунта</h2>
              <form onSubmit={handleProfileSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>ФИО / Имя пользователя</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Электронная почта (Email)</label>
                  <input 
                    type="email" 
                    className={styles.input} 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Номер телефона</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="+996 ..."
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Город / Адрес</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                </div>

                {isEmployer && (
                  <>
                    <h3 style={{ marginTop: '24px', fontWeight: 700 }}>Данные компании</h3>
                    <div className={styles.formGroup}>
                      <label>Название организации</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        value={profileForm.companyTitle}
                        onChange={(e) => setProfileForm({ ...profileForm, companyTitle: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Сайт компании</label>
                      <input 
                        type="text" 
                        className={styles.input} 
                        placeholder="https://..."
                        value={profileForm.site}
                        onChange={(e) => setProfileForm({ ...profileForm, site: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>О компании</label>
                      <textarea 
                        className={styles.textarea} 
                        rows={4}
                        value={profileForm.aboutCompany}
                        onChange={(e) => setProfileForm({ ...profileForm, aboutCompany: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <button type="submit" className={styles.btnCreate}>Сохранить изменения</button>
              </form>
            </div>
          )}

          {/* Resumes Tab (Candidate) */}
          {activeTab === 'resumes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className={styles.tabTitle} style={{ margin: 0, border: 'none' }}>Мои резюме</h2>
                <button 
                  className={styles.btnCreate}
                  onClick={() => {
                    setEditingResume(null);
                    setResumeForm({ career_objective: '', salary: '', city: '', scope: '', busyness: '', key_skills: '', about_me: '' });
                    setShowResumeModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Создать резюме
                </button>
              </div>

              {resumesLoading ? (
                <div>Загрузка списка резюме...</div>
              ) : resumes.length > 0 ? (
                <div className={styles.cardsList}>
                  {resumes.map(resume => (
                    <div key={resume.id} className={styles.itemCard}>
                      <div className={styles.itemInfo}>
                        <Link href={`/resumes/${resume.id}`} className={styles.itemTitle}>
                          {resume.career_objective}
                        </Link>
                        <div className={styles.itemMeta}>
                          <span>З/П: {resume.salary ? `${Number(resume.salary).toLocaleString()} KGS` : 'договорная'}</span>
                          <span>Статус: {resume.moderated ? 'Опубликовано' : 'На модерации'}</span>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button 
                          className={styles.btnAction}
                          onClick={() => {
                            setEditingResume(resume);
                            setResumeForm({
                              career_objective: resume.career_objective || '',
                              salary: resume.salary ? resume.salary.toString() : '',
                              city: resume.city?.toString() || '',
                              scope: resume.scope?.toString() || '',
                              busyness: resume.busyness?.toString() || '',
                              key_skills: resume.key_skills || '',
                              about_me: resume.about_me || ''
                            });
                            setShowResumeModal(true);
                          }}
                        >
                          Редактировать
                        </button>
                        <button 
                          className={`${styles.btnAction} text-red-600`}
                          onClick={() => handleDeleteResume(resume.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>У вас пока нет созданных резюме. Создайте первое резюме, чтобы откликаться на вакансии!</div>
              )}
            </div>
          )}

          {/* Subscriptions Tab (Candidate) */}
          {activeTab === 'subscriptions' && (
            <div>
              <h2 className={styles.tabTitle}>Мои подписки</h2>
              <div className={styles.emptyState}>
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <span>У вас нет активных почтовых рассылок и уведомлений о новых вакансиях.</span>
              </div>
            </div>
          )}

          {/* Vacancies Tab (Employer) */}
          {activeTab === 'vacancies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className={styles.tabTitle} style={{ margin: 0, border: 'none' }}>Мои вакансии</h2>
                <button 
                  className={styles.btnCreate}
                  onClick={() => {
                    setEditingVacancy(null);
                    setVacancyForm({ position: '', wages_from: '', wages_to: '', city: '', scope: '', busyness: '', experience: '', overview: '', qualification_requirements: '', duties: '', conditions: '' });
                    setShowVacancyModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Добавить вакансию
                </button>
              </div>

              <div className={styles.subTabs}>
                <button 
                  className={`${styles.subTab} ${vacancyStatusTab === 'published' ? styles.subTabActive : ''}`}
                  onClick={() => setVacancyStatusTab('published')}
                >
                  Опубликованные
                </button>
                <button 
                  className={`${styles.subTab} ${vacancyStatusTab === 'checking' ? styles.subTabActive : ''}`}
                  onClick={() => setVacancyStatusTab('checking')}
                >
                  На проверке
                </button>
                <button 
                  className={`${styles.subTab} ${vacancyStatusTab === 'archives' ? styles.subTabActive : ''}`}
                  onClick={() => setVacancyStatusTab('archives')}
                >
                  Архив
                </button>
                <button 
                  className={`${styles.subTab} ${vacancyStatusTab === 'drafts' ? styles.subTabActive : ''}`}
                  onClick={() => setVacancyStatusTab('drafts')}
                >
                  Черновики
                </button>
              </div>

              {vacanciesLoading ? (
                <div style={{ marginTop: '16px' }}>Загрузка списка вакансий...</div>
              ) : vacancies.length > 0 ? (
                <div className={styles.cardsList}>
                  {vacancies.map(vacancy => (
                    <div key={vacancy.id} className={styles.itemCard}>
                      <div className={styles.itemInfo}>
                        <Link href={`/vacancies/${vacancy.id}`} className={styles.itemTitle}>
                          {vacancy.position}
                        </Link>
                        <div className={styles.itemMeta}>
                          <span>Просмотров: {vacancy.count_view}</span>
                          <span>Откликов: {vacancy.count_response}</span>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        {vacancy.draft && (
                          <button 
                            className={`${styles.btnAction} ${styles.btnActionPrimary}`}
                            onClick={() => handlePublishVacancy(vacancy.id)}
                          >
                            Опубликовать (720 KGS)
                          </button>
                        )}
                        <button 
                          className={styles.btnAction}
                          onClick={() => {
                            setEditingVacancy(vacancy);
                            setVacancyForm({
                              position: vacancy.position,
                              wages_from: vacancy.wages_from ? vacancy.wages_from.toString() : '',
                              wages_to: vacancy.wages_to ? vacancy.wages_to.toString() : '',
                              city: vacancy.city?.toString() || '',
                              scope: vacancy.scope?.toString() || '',
                              busyness: vacancy.busyness?.toString() || '',
                              experience: vacancy.experience || '',
                              overview: vacancy.overview || '',
                              qualification_requirements: vacancy.qualification_requirements || '',
                              duties: vacancy.duties || '',
                              conditions: vacancy.conditions || ''
                            });
                            setShowVacancyModal(true);
                          }}
                        >
                          Редактировать
                        </button>
                        <button 
                          className={`${styles.btnAction} text-red-600`}
                          onClick={() => handleDeleteVacancy(vacancy.id)}
                        >
                          В архив
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>В этой категории пока нет вакансий.</div>
              )}
            </div>
          )}

          {/* Candidate Responses (Employer) */}
          {activeTab === 'responses' && (
            <div>
              <h2 className={styles.tabTitle}>Отклики соискателей</h2>
              <div className={styles.cardsList}>
                <div className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>Алексей Иванов</div>
                    <div className={styles.itemMeta}>
                      <span>Отклик на: <strong>Senior Python Developer</strong></span>
                      <span>Дата: 2026-05-20</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '8px', color: 'hsl(var(--muted-foreground))' }}>
                      <FileText className="w-4 h-4 inline mr-1" /> Резюме прикреплено: <Link href="/resumes/201" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>Алексей Иванов — Python разработчик</Link>
                    </div>
                  </div>
                  <div>
                    <Link href="/resumes/201" className={`${styles.btnAction} ${styles.btnActionPrimary}`}>
                      Посмотреть резюме
                    </Link>
                  </div>
                </div>

                <div className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitle}>Мария Сыдыкова</div>
                    <div className={styles.itemMeta}>
                      <span>Отклик на: <strong>Project Manager / Scrum Master</strong></span>
                      <span>Дата: 2026-05-19</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '8px', color: 'hsl(var(--muted-foreground))' }}>
                      <FileText className="w-4 h-4 inline mr-1" /> Прикрепленные файлы: <code>CoverLetter.docx</code> (1.2 MB)
                    </div>
                  </div>
                  <div>
                    <Link href="/resumes/202" className={`${styles.btnAction} ${styles.btnActionPrimary}`}>
                      Открыть контакты
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction History Tab */}
          {activeTab === 'history' && (
            <div>
              <h2 className={styles.tabTitle}>История платежей и операций</h2>
              <div className={styles.historyLogs}>
                {transactions.map((tx, index) => (
                  <div key={tx.id || index} className={styles.historyItem}>
                    <div>
                      <div className={styles.historyDesc}>{tx.description}</div>
                      <div className={styles.historyDate}>{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                    <div className={`${styles.amount} ${tx.change > 0 ? styles.amountPositive : styles.amountNegative}`}>
                      {tx.change > 0 ? `+${tx.change}` : tx.change} KGS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Topup simulation modal */}
      {showTopupModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Пополнение баланса (Демо-режим)</h3>
              <button className={styles.closeButton} onClick={() => setShowTopupModal(false)}>×</button>
            </div>

            <form onSubmit={handleTopupSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Сумма пополнения (KGS)*</label>
                <input 
                  type="number" 
                  className={styles.input}
                  required
                  placeholder="Например, 1000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Способ оплаты</label>
                <select 
                  className={styles.select}
                  value={topupMethod}
                  onChange={(e) => setTopupMethod(e.target.value)}
                >
                  <option value="card">FreedomPay Visa / Mastercard</option>
                  <option value="mobilnik">Платежный терминал (Mobilnik)</option>
                  <option value="elcart">Элкарт Онлайн</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Пополнить</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowTopupModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resume editing/creating modal */}
      {showResumeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '650px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingResume ? 'Редактировать резюме' : 'Создать резюме'}</h3>
              <button className={styles.closeButton} onClick={() => setShowResumeModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateOrEditResume} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Желаемая должность*</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="Например, Frontend разработчик"
                  value={resumeForm.career_objective}
                  onChange={(e) => setResumeForm({ ...resumeForm, career_objective: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Желаемая заработная плата (KGS)</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    placeholder="Например, 50000"
                    value={resumeForm.salary}
                    onChange={(e) => setResumeForm({ ...resumeForm, salary: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Город проживания</label>
                  <select 
                    className={styles.select}
                    value={resumeForm.city}
                    onChange={(e) => setResumeForm({ ...resumeForm, city: e.target.value })}
                  >
                    <option value="">Выберите город...</option>
                    {lookups?.cities.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Ключевые навыки (через запятую)</label>
                <input 
                  type="text" 
                  className={styles.input}
                  placeholder="React, Next.js, TypeScript, CSS Modules"
                  value={resumeForm.key_skills}
                  onChange={(e) => setResumeForm({ ...resumeForm, key_skills: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>О себе</label>
                <textarea 
                  className={styles.textarea} 
                  rows={4}
                  placeholder="Расскажите о своем опыте и сильных сторонах..."
                  value={resumeForm.about_me}
                  onChange={(e) => setResumeForm({ ...resumeForm, about_me: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Сохранить резюме</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowResumeModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vacancy editing/creating modal */}
      {showVacancyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingVacancy ? 'Редактировать вакансию' : 'Добавить новую вакансию'}</h3>
              <button className={styles.closeButton} onClick={() => setShowVacancyModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateOrEditVacancy} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Название должности*</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required
                  placeholder="Например, Senior Python Developer"
                  value={vacancyForm.position}
                  onChange={(e) => setVacancyForm({ ...vacancyForm, position: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Оклад от (KGS)</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    value={vacancyForm.wages_from}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, wages_from: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Оклад до (KGS)</label>
                  <input 
                    type="number" 
                    className={styles.input}
                    value={vacancyForm.wages_to}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, wages_to: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Город работы</label>
                  <select 
                    className={styles.select}
                    value={vacancyForm.city}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, city: e.target.value })}
                  >
                    <option value="">Выберите город...</option>
                    {lookups?.cities.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Сфера деятельности</label>
                  <select 
                    className={styles.select}
                    value={vacancyForm.scope}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, scope: e.target.value })}
                  >
                    <option value="">Выберите сферу...</option>
                    {lookups?.scopes.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Тип занятости</label>
                  <select 
                    className={styles.select}
                    value={vacancyForm.busyness}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, busyness: e.target.value })}
                  >
                    <option value="">Выберите тип...</option>
                    {lookups?.busynesses.map(b => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Опыт работы</label>
                  <input 
                    type="text" 
                    className={styles.input}
                    placeholder="Например: 1-3 года"
                    value={vacancyForm.experience}
                    onChange={(e) => setVacancyForm({ ...vacancyForm, experience: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Описание вакансии</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  placeholder="Краткое описание вакансии..."
                  value={vacancyForm.overview}
                  onChange={(e) => setVacancyForm({ ...vacancyForm, overview: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Требования</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  placeholder="Что требуется от кандидата..."
                  value={vacancyForm.qualification_requirements}
                  onChange={(e) => setVacancyForm({ ...vacancyForm, qualification_requirements: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Обязанности</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  placeholder="Что нужно будет делать..."
                  value={vacancyForm.duties}
                  onChange={(e) => setVacancyForm({ ...vacancyForm, duties: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Условия</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3}
                  placeholder="Что вы предлагаете сотруднику..."
                  value={vacancyForm.conditions}
                  onChange={(e) => setVacancyForm({ ...vacancyForm, conditions: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Сохранить черновик</button>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setShowVacancyModal(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
