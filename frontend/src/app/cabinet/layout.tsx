'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getImageUrl } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  Users,
  Heart,
  Search,
  Diamond,
  BarChart2,
  Settings,
  Shield,
  MessageSquare,
  HelpCircle,
  FileText,
  Building2,
  User
} from 'lucide-react';

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname() ?? '';
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user === null) {
      router.push('/auth/login?next=/cabinet');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const isEmployer = user.user_type === 'employer';
  const isWorker = user.user_type === 'worker';

  type LinkItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string | number;
  };

  const employerLinks: LinkItem[] = [
    { label: 'Панель управления',   href: '/cabinet',              icon: <LayoutDashboard size={20} /> },
    { label: 'Мои вакансии',        href: '/cabinet/vacancies',    icon: <Briefcase size={20} /> },
    { label: 'Отклики',             href: '/cabinet/responses',    icon: <Mail size={20} /> },
    { label: 'Избранные резюме',    href: '/cabinet/saved-resumes',icon: <Heart size={20} /> },
    { label: 'Профиль организации', href: '/cabinet/profile',      icon: <User size={20} /> },
    { label: 'Настройки',          href: '/cabinet/settings',     icon: <Settings size={20} /> },
  ];

  const workerLinks: LinkItem[] = [
    { label: 'Мой кабинет',          href: '/cabinet',                icon: <LayoutDashboard size={20} /> },
    { label: 'Мои резюме',           href: '/cabinet/resumes',        icon: <FileText size={20} /> },
    { label: 'Отклики',              href: '/cabinet/responses',      icon: <Mail size={20} /> },
    { label: 'Избранные вакансии',   href: '/cabinet/saved-vacancies',icon: <Heart size={20} /> },
    { label: 'Мой профиль',          href: '/cabinet/profile',        icon: <User size={20} /> },
    { label: 'Настройки',           href: '/cabinet/settings',       icon: <Settings size={20} /> },
  ];

  const links = isEmployer ? employerLinks : workerLinks;

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50">
      
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 sticky top-16 overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Profile Card */}
        <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
          {isEmployer ? (
            <>
              <div className="w-20 h-20 rounded-2xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden mb-4 p-2 shadow-sm">
                {user.company?.logo ? (
                  <img src={getImageUrl(user.company.logo)} alt="Company Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">LOGO</span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{user.company?.title || 'Компания не указана'}</h3>
              <p className="text-sm text-gray-500 mb-2">ID компании: {user.company?.id || '---'}</p>
              {user.company?.is_verified && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-green-100">
                  <Shield size={12} /> Проверенная компания
                </span>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full border border-gray-100 bg-white flex items-center justify-center overflow-hidden mb-4 shadow-sm">
                {user.photo ? (
                  <img src={getImageUrl(user.photo)} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-300">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                {user.profile?.name} {user.profile?.sname}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{user.email}</p>
              <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-blue-100">
                Соискатель
              </span>
            </>
          )}
        </div>

        {/* Balance Card (Employer only) */}
        {isEmployer && (
          <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ваш баланс</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-gray-900 leading-none">{Number(user.balance || 0).toLocaleString()}</span>
              <span className="text-sm font-medium text-gray-600 mb-0.5">KGS</span>
            </div>
            <Link href="/cabinet/billing" className="block w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold text-center rounded-xl transition-colors shadow-sm">
              Пополнить баланс
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 flex-1 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'} transition-colors`}>
                    {link.icon}
                  </span>
                  {link.label}
                </div>
                {link.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Promo Banner (Employer only) */}
        {isEmployer && (
          <div className="p-6 mt-auto">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <Diamond size={24} className="text-yellow-300 mb-3" />
              <h4 className="font-bold text-base mb-1">Расширьте возможности</h4>
              <p className="text-xs text-indigo-100 mb-4 opacity-90 leading-relaxed">Получите больше откликов и доступ к базе кандидатов с тарифом Pro HR.</p>
              <Link href="/pricing" className="block w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-bold text-center rounded-lg transition-colors border border-white/20">
                Подробнее
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden relative">
        {children}
      </main>

    </div>
  );
}
