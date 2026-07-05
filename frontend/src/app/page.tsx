'use client';

import { getImageUrl } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Heart, ArrowRight, ChevronRight,
  Monitor, BarChart2, Megaphone, ShoppingBag, HardHat, Palette,
  Users, Briefcase, TrendingUp, CheckCircle
} from 'lucide-react';
import { lookupsService } from '@/services/lookups.service';
import { vacanciesService } from '@/services/vacancies.service';
import { Lookups, Vacancy } from '@/types';

/* ─── Category icons & colours ─────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'IT': Monitor, 'Финансы': BarChart2, 'Маркетинг': Megaphone,
  'Продажи': ShoppingBag, 'Строительство': HardHat, 'Дизайн': Palette,
};
const CATEGORY_COLORS: Record<string, string> = {
  'IT': 'bg-blue-100 text-blue-600', 'Финансы': 'bg-green-100 text-green-600',
  'Маркетинг': 'bg-orange-100 text-orange-500', 'Продажи': 'bg-yellow-100 text-yellow-600',
  'Строительство': 'bg-amber-100 text-amber-600', 'Дизайн': 'bg-pink-100 text-pink-500',
};

/* ─── Static fallbacks ──────────────────────────────────────── */
const POPULAR_TAGS = ['IT', 'Маркетинг', 'Продажи', 'Финансы', 'Дизайн'];
const LOGOS = [
  { src: '/img/company_logos/beeline-sign-logo.png', alt: 'Beeline' },
  { src: '/img/company_logos/demirbanklogo.png', alt: 'DemirBank' },
  { src: '/img/company_logos/Coca-Cola_logo.svg.png', alt: 'Coca-Cola' },
  { src: '/img/company_logos/usaid.png', alt: 'USAID' },
  { src: '/img/company_logos/UNDP_logo.svg.png', alt: 'UNDP' },
  { src: '/img/company_logos/mbank.png', alt: 'MBank' },
];
const STATIC_CATEGORIES = [
  { id: '1', title: 'IT',           vacancies_count: '1 240', Icon: Monitor     },
  { id: '2', title: 'Финансы',      vacancies_count: '856',   Icon: BarChart2   },
  { id: '3', title: 'Маркетинг',    vacancies_count: '642',   Icon: Megaphone   },
  { id: '4', title: 'Продажи',      vacancies_count: '578',   Icon: ShoppingBag },
  { id: '5', title: 'Строительство',vacancies_count: '432',   Icon: HardHat     },
  { id: '6', title: 'Дизайн',       vacancies_count: '289',   Icon: Palette     },
];

/* ─── Badge components ──────────────────────────────────────── */
const HotBadge    = () => <span className="bg-orange-100 text-orange-500 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">HOT</span>;
const NewBadge    = () => <span className="bg-green-100  text-green-600  text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">NEW</span>;
const RemoteBadge = () => <span className="bg-blue-100   text-blue-600   text-[11px] font-bold px-2 py-0.5 rounded-full">Удалённо</span>;

export default function Home() {
  const router = useRouter();
  const [lookups, setLookups]           = useState<Lookups | null>(null);
  const [hotVacancies, setHotVacancies] = useState<Vacancy[]>([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [companyCount, setCompanyCount] = useState(0);
  const trustedByRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lookupsService.getLookups().then(d => setLookups(d)).catch(() => {});
    vacanciesService.getVacancies({ page: 1, is_hot: true })
      .then(r => { if (r.results?.length) setHotVacancies(r.results.slice(0, 4)); })
      .catch(() => {});
  }, []);

  /* counter animation */
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let v = 0; const end = 500; const step = Math.ceil(end / (1200 / 16));
      const t = setInterval(() => {
        v += step;
        if (v >= end) { setCompanyCount(end); clearInterval(t); } else setCompanyCount(v);
      }, 16);
      if (trustedByRef.current) observer.unobserve(trustedByRef.current);
    }, { threshold: 0.1 });
    if (trustedByRef.current) observer.observe(trustedByRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/vacancies?query=${encodeURIComponent(searchQuery)}` : '/vacancies');
  };

  const getSalary = (v: Vacancy) => {
    if (v.wages_from && v.wages_to) return `${Number(v.wages_from).toLocaleString()} – ${Number(v.wages_to).toLocaleString()} сом`;
    if (v.wages_from) return `от ${Number(v.wages_from).toLocaleString()} сом`;
    if (v.wages_to)   return `до ${Number(v.wages_to).toLocaleString()} сом`;
    return 'Договорная';
  };

  const categories = lookups?.scopes?.slice(0, 6) || STATIC_CATEGORIES;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {/* ══════════════════════════════════════════════════════
          HERO — clean, left text + right illustration only
      ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#eef3ff] via-[#e4ecff] to-[#d6e4ff]" />
        {/* soft decorative blobs – за контентом, не мешают */}
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10 pt-14 pb-0 flex flex-col lg:flex-row items-center lg:items-end gap-12">

          {/* ── Left: text + search ── */}
          <div className="lg:w-[55%] pb-16 z-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-[#4452c9] text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <CheckCircle size={15} />
              Более 12 000 актуальных вакансий
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-[62px] font-extrabold leading-[1.1] text-slate-900 mb-5">
              Найдите работу,{' '}
              <span className="text-[#4452c9]">которая вам подходит</span>
            </h1>
            <p className="text-slate-500 text-xl mb-10 max-w-xl">
              Тысячи проверенных вакансий от надёжных компаний Кыргызстана
            </p>

            {/* Search box */}
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl shadow-lg flex items-center max-w-xl mb-7 overflow-hidden border border-slate-200"
            >
              <div className="flex items-center flex-1 px-5 py-1">
                <Search className="text-slate-400 shrink-0 mr-3" size={20} />
                <input
                  type="text"
                  placeholder="Должность, компания или навык"
                  className="flex-1 py-4 bg-transparent focus:outline-none text-slate-700 text-[15px] placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="m-2 bg-[#4452c9] hover:bg-[#3a46b3] text-white font-bold py-3.5 px-8 rounded-xl transition-colors text-[15px] shrink-0"
              >
                Найти
              </button>
            </form>

            {/* Popular tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">Популярные:</span>
              {POPULAR_TAGS.map(tag => (
                <Link
                  key={tag}
                  href={`/vacancies?query=${tag}`}
                  className="text-sm bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 hover:border-[#4452c9] hover:text-[#4452c9] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Briefcase, label: '12 000+ вакансий' },
                { icon: Users, label: '500+ компаний' },
                { icon: TrendingUp, label: 'Новые каждый день' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-slate-500 text-sm">
                  <Icon size={16} className="text-[#4452c9]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: illustration only, no floating cards ── */}
          <div className="lg:w-[45%] flex justify-center lg:justify-end self-end z-10">
            <img
              src="/img/hero-illustration.png"
              alt="Найдите работу на Employment.kg"
              className="relative z-10 max-w-full h-auto lg:max-h-[520px] object-bottom"
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TRUSTED BY
      ══════════════════════════════════════════════════════ */}
      <section ref={trustedByRef}>
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mx-4 md:mx-8 xl:mx-auto max-w-[1280px] mt-12 flex flex-col xl:flex-row items-center justify-between gap-8 border border-slate-100">
          <div className="text-slate-700 font-medium xl:w-1/4 shrink-0">
            <span className="text-xl font-bold text-slate-900 block">{companyCount}+ компаний</span>
            уже нанимают на<br/>нашей платформе
          </div>
          <div className="xl:w-3/4 w-full overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="animate-marquee-right flex gap-12 items-center">
              {[...LOGOS, ...LOGOS].map((logo, i) => (
                <img
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  className="h-10 md:h-12 object-contain opacity-60 hover:opacity-100 transition-opacity duration-300 shrink-0"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 pb-20">

        {/* ── Вакансии дня ── */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-[26px] font-bold text-slate-900">Вакансии дня</h2>
            <Link href="/vacancies?is_hot=true" className="text-[#4452c9] font-medium text-sm hover:underline flex items-center gap-1">
              Смотреть все <ArrowRight size={16}/>
            </Link>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hotVacancies.length > 0 ? hotVacancies.map((vacancy, idx) => (
                <div key={vacancy.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                  {/* logo + badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                      {(vacancy.company_logo || vacancy.company?.logo)
                        ? <img src={getImageUrl((vacancy.company_logo || vacancy.company?.logo))} alt={(vacancy.company_title || vacancy.company?.title) || 'Компания'} className="w-full h-full object-contain"/>
                        : <span className="text-[#4452c9] font-bold text-lg">{((vacancy.company_title || vacancy.company?.title) || vacancy.position).charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    {idx === 0 && <HotBadge/>}
                    {idx === 1 && <NewBadge/>}
                    {idx === 2 && <RemoteBadge/>}
                  </div>

                  <div className="text-xs text-slate-500 font-medium mb-1">{(vacancy.company_title || vacancy.company?.title) || 'Компания'}</div>
                  <Link href={`/vacancies/${vacancy.id}`}>
                    <h3 className="font-bold text-slate-900 text-[15px] mb-2 leading-snug line-clamp-2 group-hover:text-[#4452c9] transition-colors min-h-[40px]">
                      {vacancy.position}
                    </h3>
                  </Link>

                  <div className="text-slate-900 font-bold text-base mb-3">{getSalary(vacancy)}</div>

                  <div className="flex items-center text-xs text-slate-500 mb-3 gap-1">
                    <MapPin size={13} className="shrink-0"/>
                    <span className="line-clamp-1">
                      {vacancy.city_detail?.title || 'Бишкек'}, Кыргызстан
                      {vacancy.busyness_detail && ` • ${vacancy.busyness_detail.title}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                    {vacancy.scope_detail && (
                      <span className="bg-slate-50 text-slate-500 text-xs px-2 py-0.5 rounded border border-slate-100">{vacancy.scope_detail.title}</span>
                    )}
                    {vacancy.busyness_detail && (
                      <span className="bg-slate-50 text-slate-500 text-xs px-2 py-0.5 rounded border border-slate-100">{vacancy.busyness_detail.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <Link href={`/vacancies/${vacancy.id}`} className="flex-1 text-center border border-[#4452c9] text-[#4452c9] font-semibold text-sm py-2 rounded-xl hover:bg-blue-50 transition-colors">
                      Откликнуться
                    </Link>
                    <button className="w-10 h-10 shrink-0 flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors">
                      <Heart size={17}/>
                    </button>
                  </div>
                </div>
              )) : (
                /* skeleton */
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm h-64 animate-pulse">
                    <div className="w-11 h-11 bg-slate-200 rounded-xl mb-4"/>
                    <div className="h-3 bg-slate-200 rounded mb-2 w-3/4"/>
                    <div className="h-4 bg-slate-200 rounded mb-2 w-full"/>
                    <div className="h-4 bg-slate-200 rounded mb-4 w-2/3"/>
                    <div className="h-3 bg-slate-200 rounded mb-1 w-1/2"/>
                    <div className="h-3 bg-slate-200 rounded w-1/3"/>
                  </div>
                ))
              )}
            </div>
            <button className="absolute -right-5 top-1/2 -translate-y-1/2 hidden xl:flex w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center shadow hover:shadow-md transition-all text-slate-500 hover:text-[#4452c9]">
              <ChevronRight size={20}/>
            </button>
          </div>
        </section>

        {/* ── Вакансии по категориям ── */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-[26px] font-bold text-slate-900">Вакансии по категориям</h2>
            <Link href="/vacancies" className="text-[#4452c9] font-medium text-sm hover:underline flex items-center gap-1">
              Все категории <ArrowRight size={16}/>
            </Link>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.map((scope: any, i: number) => {
                const colorClass = CATEGORY_COLORS[scope.title] || 'bg-blue-100 text-blue-600';
                const Icon = scope.Icon || CATEGORY_ICONS[scope.title] || Monitor;
                return (
                  <Link
                    key={scope.id || i}
                    href={`/vacancies?scope_id=${scope.id}`}
                    className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-start hover:border-[#4452c9]/40 hover:shadow-md transition-all group"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colorClass} group-hover:scale-110 transition-transform`}>
                      {scope.icon
                        ? <img src={scope.icon} alt={scope.title} className="w-6 h-6 object-contain"/>
                        : <Icon size={22}/>
                      }
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#4452c9] transition-colors line-clamp-1">{scope.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{scope.vacancies_count || '—'} вакансий</p>
                  </Link>
                );
              })}
            </div>
            <button className="absolute -right-5 top-1/2 -translate-y-1/2 hidden xl:flex w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center shadow hover:shadow-md transition-all text-slate-500 hover:text-[#4452c9]">
              <ChevronRight size={20}/>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            CTA BANNER — clean redesign, no ugly briefcase
        ══════════════════════════════════════════════════════ */}
        <section className="mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-[#4452c9] px-8 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* subtle geometric pattern */}
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`, backgroundSize: '40px 40px'}}
            />
            {/* accent glow */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute -bottom-20 right-1/4 w-56 h-56 bg-indigo-400/30 rounded-full pointer-events-none" />

            {/* Left: text */}
            <div className="relative z-10 md:w-3/5">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
                <Users size={14} />
                Для работодателей
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                Ищете сотрудника?
              </h2>
              <p className="text-white/75 text-base mb-8 max-w-md leading-relaxed">
                Разместите вакансию и получите отклики<br className="hidden md:block"/>от лучших специалистов уже сегодня
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/vacancies/create"
                  className="px-7 py-3 bg-white text-[#4452c9] font-bold rounded-xl hover:bg-blue-50 transition-colors text-center text-sm"
                >
                  Разместить вакансию
                </Link>
                <Link
                  href="/pricing"
                  className="px-7 py-3 border border-white/40 text-white font-medium rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  Узнать больше <ArrowRight size={16}/>
                </Link>
              </div>
            </div>

            {/* Right: stats cards instead of ugly briefcase */}
            <div className="relative z-10 md:w-2/5 flex flex-col gap-3 md:items-end">
              {[
                { label: 'Активных резюме', value: '45 000+', icon: Users },
                { label: 'Откликов в день', value: '1 200+', icon: TrendingUp },
                { label: 'Закрытых вакансий', value: '8 500+', icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 w-full md:w-auto">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg leading-none">{value}</div>
                    <div className="text-white/60 text-xs mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
