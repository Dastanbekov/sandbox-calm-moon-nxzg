'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import { getImageUrl } from '@/lib/utils';
import {
  Heart,
  Bell,
  Trophy,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  FileText,
  Briefcase,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'] });

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
}

interface DropdownItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, label, pathname }: NavLink & { pathname: string }) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={[
        'relative px-1 py-5 text-[15px] font-medium transition-colors',
        'border-b-2',
        isActive
          ? 'text-blue-600 border-blue-600'
          : 'text-gray-700 border-transparent hover:text-blue-600',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

function DropdownMenu({
  trigger,
  items,
  align = 'right',
}: {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[15px] font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div
          className={[
            'absolute top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {items.map((item, i) =>
            item.onClick ? (
              <button
                key={i}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={[
                  'w-full flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors text-left',
                  item.danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </button>
            ) : (
              <Link
                key={i}
                href={item.href}
                onClick={() => setOpen(false)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 text-[14px] transition-colors',
                  item.danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function AvatarCircle({ name, photo }: { name: string; photo?: string | null }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (photo) {
    return (
      <img
        src={getImageUrl(photo)}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border border-gray-200"
      />
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-[13px] font-bold flex items-center justify-center select-none">
      {initials || <User size={14} />}
    </span>
  );
}

function LanguageSelector() {
  const [lang, setLang] = useState('ru');
  useEffect(() => {
    setLang(localStorage.getItem('app_language') || 'ru');
  }, []);
  
  const handleLangChange = (l: string) => {
    setLang(l);
    localStorage.setItem('app_language', l);
  };

  const currentLabel: Record<string, string> = { kg: 'KG', ru: 'RU', eng: 'EN' };
  
  return (
    <DropdownMenu
      align="right"
      trigger={
        <div className="flex items-center gap-1.5 px-3 py-2 ml-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
          <Globe size={18} />
          <span className="text-[14px] font-medium">{currentLabel[lang] || 'RU'}</span>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
      }
      items={[
        { label: 'Кыргызча', href: '#', onClick: () => handleLangChange('kg') },
        { label: 'Русский', href: '#', onClick: () => handleLangChange('ru') },
        { label: 'English', href: '#', onClick: () => handleLangChange('eng') },
      ]}
    />
  );
}

// ─── Main Header ─────────────────────────────────────────────────────────────

export default function Header() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isWorker = user?.user_type === 'worker';
  const isEmployer = user?.user_type === 'employer';

  const mainLinks: NavLink[] = [
    { label: 'Вакансии', href: '/vacancies' },
    { label: 'Резюме', href: '/resumes' },
    { label: 'Работодатели', href: '/companies' },
  ];



  const workerUserMenu: DropdownItem[] = [
    { label: 'Мой кабинет', href: '/cabinet', icon: <LayoutDashboard size={15} /> },
    { label: 'Настройки', href: '/cabinet/settings', icon: <Settings size={15} /> },
    {
      label: 'Выйти',
      href: '#',
      icon: <LogOut size={15} />,
      danger: true,
      onClick: () => logout().then(() => router.push('/')),
    },
  ];

  const employerUserMenu: DropdownItem[] = [
    { label: 'Панель управления', href: '/cabinet', icon: <LayoutDashboard size={15} /> },
    { label: 'Настройки', href: '/cabinet/settings', icon: <Settings size={15} /> },
    {
      label: 'Выйти',
      href: '#',
      icon: <LogOut size={15} />,
      danger: true,
      onClick: () => logout().then(() => router.push('/')),
    },
  ];

  const userDisplayName = user
    ? user.company
      ? user.company.title || user.name
      : user.profile
      ? [user.profile.name, user.profile.sname].filter(Boolean).join(' ') || user.name
      : user.name
    : '';

  const userRoleLabel = isEmployer ? 'Работодатель' : 'Соискатель';

  // Real header stats: saved items + unread counts
  const [headerStats, setHeaderStats] = useState({ saved_vacancies_count: 0, saved_resumes_count: 0, unread_messages: 0, unread_notifications: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = () => {
      api.get('/api/auth/header-stats/')
        .then(res => setHeaderStats(res.data))
        .catch(() => {}); // silently ignore if endpoint not available
    };
    fetchStats();
    // Re-fetch every 60 seconds
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  const bookmarkCount = headerStats.saved_vacancies_count + headerStats.saved_resumes_count;
  const notifCount = headerStats.unread_messages + headerStats.unread_notifications;

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="mx-auto flex h-16 w-full max-w-[1400px] items-center px-4 md:px-8 gap-6">

          {/* ── Logo ────────────────────────────────────────────────────────── */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <img src="/logo.png" alt="employment.kg logo" className="w-9 h-9 object-contain" />
            <span className={`text-[19px] font-bold hidden sm:block tracking-tight ${poppins.className}`}>
              <span className="text-black">employment.</span>
              <span className="text-blue-600">kg</span>
            </span>
          </Link>

          {/* ── Desktop Nav ─────────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-6 h-16 ml-auto mr-4">
            {mainLinks.map((link) => (
              <NavLink key={link.href} {...link} pathname={pathname} />
            ))}


          </div>

          {/* ── Right Side ──────────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {/* If checking auth, show nothing or skeleton */}
            {isLoading ? (
              <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
            ) : !user ? (
              // Unauthenticated
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-[14px] font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/vacancies/create"
                  className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 transition-colors"
                >
                  Разместить вакансию
                </Link>
              </>
            ) : (
              <>
                {/* Favourites */}
                <Link href="/favorites" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600" title="Избранное">
                  <Heart size={20} />
                  <Badge count={bookmarkCount} />
                </Link>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600" title="Уведомления">
                  <Bell size={20} />
                  <Badge count={notifCount} />
                </button>

                {/* Messages icon instead of Trophy */}
                {isEmployer && (
                  <Link href="/cabinet" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-blue-600" title="Сообщения">
                    <MessageSquare size={20} />
                  </Link>
                )}

                {/* User dropdown - wrapper: ограничиваем ширину, чтобы длинное название компании не вытесняло кнопку */}
                <div className="min-w-0 max-w-[180px] shrink">
                  <DropdownMenu
                    align="right"
                    trigger={
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-0">
                        <AvatarCircle name={userDisplayName} photo={user.company?.logo || user.photo} />
                        <div className="text-left hidden lg:block min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 leading-tight max-w-[100px] truncate">
                            {userDisplayName || 'Пользователь'}
                          </p>
                          <p className="text-[11px] text-gray-500 leading-tight">{userRoleLabel}</p>
                        </div>
                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                      </div>
                    }
                    items={isEmployer ? employerUserMenu : workerUserMenu}
                  />
                </div>

                {/* CTA button */}
                {isWorker ? (
                  <Link
                    href="/resumes/create"
                    className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Разместить резюме
                  </Link>
                ) : (
                  <Link
                    href="/vacancies/create"
                    className="shrink-0 whitespace-nowrap px-4 py-2 rounded-lg bg-blue-600 text-white text-[14px] font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Разместить вакансию
                  </Link>
                )}
              </>
            )}

            {/* Language Selector in far right */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
          </div>

          {/* ── Mobile hamburger ────────────────────────────────────────────── */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Открыть меню"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* ── Mobile menu ───────────────────────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg px-4 py-4 flex flex-col gap-1">
            {mainLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    'px-3 py-3 rounded-lg text-[15px] font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}


            {user && (
              <Link
                href="/favorites"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
              >
                <Heart size={17} />
                Избранное
              </Link>
            )}

            <div className="h-px bg-gray-200 my-2" />

            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-lg border border-gray-300 text-[15px] font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/vacancies/create"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center px-4 py-3 rounded-lg bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-colors mt-1"
                >
                  Разместить вакансию
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/cabinet"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <LayoutDashboard size={17} />
                  Мой кабинет
                </Link>
                <Link
                  href="/cabinet/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                >
                  <Settings size={17} />
                  Настройки
                </Link>
                {isWorker ? (
                  <Link
                    href="/resumes/create"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-lg bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-colors mt-1"
                  >
                    Разместить резюме
                  </Link>
                ) : (
                  <Link
                    href="/vacancies/create"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center px-4 py-3 rounded-lg bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 transition-colors mt-1"
                  >
                    Разместить вакансию
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout().then(() => router.push('/'));
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={17} />
                  Выйти
                </button>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
}
