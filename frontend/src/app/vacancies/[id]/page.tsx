'use client';

import { getImageUrl } from '@/lib/utils';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { vacanciesService } from '@/services/vacancies.service';
import { Vacancy } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import VerifiedBadge from '@/components/VerifiedBadge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Clock, 
  User as UserIcon, 
  Calendar, 
  Heart, 
  Share2, 
  CheckCircle2,
  Building,
  Globe,
  Users,
  Send,
  DollarSign,
  GraduationCap,
  Award,
  Smartphone,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import TranslationModal from '@/components/modals/TranslationModal';
import { api } from '@/services/auth.service';

function VacancyDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [allLanguages, setAllLanguages] = useState<any[]>([]);

  const isEmptyHtml = (html?: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
    if (stripped.length > 0) return false;
    if (html.includes('<img') || html.includes('<iframe')) return false;
    return true;
  };

  useEffect(() => {
    if (contentRef.current) {
      setIsExpandable(contentRef.current.scrollHeight > 500);
    }
  }, [vacancy]);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        const data = await vacanciesService.getVacancy(Number(id));
        setVacancy(data);
      } catch (error) {
        console.error("Error fetching vacancy details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchVacancy();
  }, [id]);

  if (isLoading) return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Загрузка...</div>;
  if (!vacancy) return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Вакансия не найдена</div>;

  const handleRespond = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?next=/vacancies/${id}`);
      return;
    }
    
    if (user.user_type !== 'worker') {
      toast.error('Только соискатели могут откликаться на вакансии');
      return;
    }

    try {
      // Fetch user's resumes
      const res = await api.get('/api/resumes/cabinet/');
      const resumes = res.data?.results || (Array.isArray(res.data) ? res.data : []);
      setUserResumes(resumes);
      
      const appLangs = vacancy.application_languages || [];
      const matchingResume = resumes.find((r: any) => 
        appLangs.length === 0 || (r.language && appLangs.includes(r.language))
      );
      
      if (matchingResume) {
        try {
          await vacanciesService.respondToVacancy(vacancy.id, matchingResume.id);
          toast.success('Вы успешно откликнулись на вакансию!');
        } catch (err: any) {
          toast.error('Ошибка при отклике: ' + (err.response?.data?.detail || err.message));
        }
      } else {
        // Needs translation
        const lookupRes = await api.get('/api/vacancies/lookups/');
        const langs = lookupRes.data?.languages || [];
        
        // Map string codes to titles because DB slugs might be None
        const langCodeToTitle: Record<string, string> = {
          'ru': 'Русский',
          'en': 'Английский',
          'ky': 'Кыргызский'
        };
        const targetTitles = appLangs.map((code: string) => langCodeToTitle[code] || code);
        
        setAllLanguages(langs.filter((l: any) => targetTitles.includes(l.title) || appLangs.includes(l.id) || appLangs.includes(l.slug)));
        setIsTranslationModalOpen(true);
      }
    } catch (error) {
      console.error(error);
      toast.error('Не удалось загрузить ваши резюме');
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = vacancy ? encodeURIComponent(`Вакансия: ${vacancy.position} в ${(vacancy.company_title || vacancy.company?.title) || 'компании'}`) : '';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: vacancy.position,
        text: `Смотрите вакансию: ${vacancy.position}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована в буфер обмена');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8 animate-fadeIn">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/vacancies" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          К списку вакансий
        </Link>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Content (Left Column) */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  {vacancy.position}
                </h1>
                {vacancy.is_hot && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
                    Hot
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                {vacancy.city && (
                  <div className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400" /> {vacancy.city.title}</div>
                )}
                {vacancy.busyness && (
                  <div className="flex items-center gap-1.5"><Briefcase size={16} className="text-gray-400" /> {vacancy.busyness.title}</div>
                )}
                {vacancy.work_format && (
                  <div className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> {vacancy.work_format}</div>
                )}
                {vacancy.experience && (
                  <div className="flex items-center gap-1.5"><UserIcon size={16} className="text-gray-400" /> Опыт: {vacancy.experience}</div>
                )}
                {vacancy.created_at && (
                  <div className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400" /> Опубликовано: {format(new Date(vacancy.created_at), 'd MMMM yyyy', { locale: ru })}</div>
                )}
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-[28px] font-bold text-green-600">
                    {vacancy.wages_from || vacancy.wages_to ? (
                      <>
                        {vacancy.wages_from ? `от ${vacancy.wages_from} ` : ''}
                        {vacancy.wages_to ? `до ${vacancy.wages_to} ` : ''}
                        {vacancy.currency_detail?.title || 'KGS'}
                      </>
                    ) : (
                      'По результатам собеседования'
                    )}
                  </span>
                  {vacancy.salary_net === true && (vacancy.wages_from || vacancy.wages_to) && (
                    <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">на руки (net)</span>
                  )}
                  {vacancy.salary_net === false && (vacancy.wages_from || vacancy.wages_to) && (
                    <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-0.5 rounded">до вычета налогов</span>
                  )}
                </div>
              </div>

              {/* Dynamic Benefits Row */}
              {vacancy.bonuses && typeof vacancy.bonuses === 'object' && Object.values(vacancy.bonuses).flat().length > 0 && (
                <div className="flex flex-wrap gap-y-3 gap-x-4 mb-8">
                  {Object.values(vacancy.bonuses).flat().map((bonus: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <CheckCircle2 size={16} className="text-blue-500" /> {bonus}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                {user?.user_type === 'employer' && user?.company_id === vacancy.company_id ? (
                  <Link href={`/vacancies/${id}/edit`} className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-8 rounded-xl transition-all flex items-center justify-center gap-2 text-[15px]">
                    Редактировать вакансию
                  </Link>
                ) : (
                  <>
                    <button onClick={handleRespond} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-10 rounded-xl transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 text-[15px]">
                      <Send size={18} className="-ml-1" />
                      Откликнуться
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-8">
              <div className={`relative ${!isExpanded && isExpandable ? 'max-h-[500px] overflow-hidden' : ''}`}>
                <div ref={contentRef} className="space-y-8">
                  {!isEmptyHtml(vacancy.overview) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Описание</h3>
                      <div className="text-gray-600 text-[15px] leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: vacancy.overview! }} />
                    </div>
                  )}
                  
                  {!isEmptyHtml(vacancy.duties) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Обязанности</h3>
                      <div className="text-gray-600 text-[15px] leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: vacancy.duties! }} />
                    </div>
                  )}
                  
                  {!isEmptyHtml(vacancy.qualification_requirements) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Требования</h3>
                      <div className="text-gray-600 text-[15px] leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: vacancy.qualification_requirements! }} />
                    </div>
                  )}
                  
                  {!isEmptyHtml(vacancy.conditions) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Условия</h3>
                      <div className="text-gray-600 text-[15px] leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-4" dangerouslySetInnerHTML={{ __html: vacancy.conditions! }} />
                    </div>
                  )}

                  {/* Company Info */}
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-1.5">
                      О компании: {(vacancy.company_title || vacancy.company?.title)}
                      {(vacancy.company_is_verified || vacancy.company?.is_verified) && <VerifiedBadge className="w-5 h-5 flex-shrink-0" />}
                    </h3>
                    <p className="text-gray-600 text-[15px] leading-relaxed">
                      {vacancy.company_about || 'Информация о компании отсутствует.'}
                    </p>
                  </div>
                  
                  {isEmptyHtml(vacancy.overview) && isEmptyHtml(vacancy.qualification_requirements) && isEmptyHtml(vacancy.duties) && isEmptyHtml(vacancy.conditions) && (
                    <div className="text-gray-500 italic">Подробное описание отсутствует.</div>
                  )}
                </div>

                {!isExpanded && isExpandable && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none flex items-end justify-center pb-2">
                    <button 
                      onClick={() => setIsExpanded(true)} 
                      className="text-blue-600 font-bold text-[15px] hover:text-blue-700 hover:underline bg-white/80 px-4 py-1 rounded-full pointer-events-auto shadow-sm"
                    >
                      Показать полностью
                    </button>
                  </div>
                )}
              </div>
              
              {isExpanded && isExpandable && (
                <div className="mt-6 flex justify-center">
                  <button 
                    onClick={() => setIsExpanded(false)} 
                    className="text-gray-500 font-medium text-[15px] hover:text-gray-800 hover:underline px-4 py-1"
                  >
                    Скрыть
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right Column) */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Company Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl border border-gray-100 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {(vacancy.company_logo || vacancy.company?.logo) ? (
                    <img src={getImageUrl((vacancy.company_logo || vacancy.company?.logo))} alt={(vacancy.company_title || vacancy.company?.title) || 'Компания'} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Building className="text-gray-300" size={32} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-1.5">
                    {(vacancy.company_title || vacancy.company?.title) || 'Компания не указана'}
                    {(vacancy.company_is_verified || vacancy.company?.is_verified) && <VerifiedBadge className="w-5 h-5 flex-shrink-0" />}
                  </h3>
                  {vacancy.company_org_type && (
                    <p className="text-sm text-gray-500 mt-0.5">{vacancy.company_org_type}</p>
                  )}
                  {vacancy.company_size && (
                    <p className="text-sm text-gray-500">{vacancy.company_size}</p>
                  )}
                </div>
              </div>
              {vacancy.company_id && (
                <Link href={`/companies/${vacancy.company_id}`} className="inline-block text-blue-600 font-medium text-sm hover:underline">
                  Все вакансии компании &rarr;
                </Link>
              )}
            </div>

            {/* Contact Person Card */}
            {(vacancy.contact_name || vacancy.contact_email || vacancy.contact_phone) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Контактное лицо</h4>
                {vacancy.contact_name && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                      {vacancy.contact_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{vacancy.contact_name}</p>
                      <p className="text-sm text-gray-500">Представитель работодателя</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {vacancy.contact_email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Email:</span>
                      <a href={`mailto:${vacancy.contact_email}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {vacancy.contact_email}
                      </a>
                    </div>
                  )}
                  {vacancy.contact_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Телефон:</span>
                      <a href={`tel:${vacancy.contact_phone}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {vacancy.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Company Extra Info */}
            {(vacancy.company_size || vacancy.company_org_type || vacancy.company_about) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">О компании</h4>
                <div className="space-y-3 mb-5">
                  {vacancy.company_size && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Users className="text-gray-400 w-5 h-5" />
                      <span>{vacancy.company_size}</span>
                    </div>
                  )}
                  {vacancy.company_org_type && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Building className="text-gray-400 w-5 h-5" />
                      <span>{vacancy.company_org_type}</span>
                    </div>
                  )}
                </div>
                {vacancy.company_id && (
                  <Link href={`/companies/${vacancy.company_id}`} className="w-full py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm flex items-center justify-center">
                    Подробнее о компании
                  </Link>
                )}
              </div>
            )}

            {/* Share */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
              <p className="text-sm font-bold text-gray-900 mb-4">Поделиться вакансией</p>
              <div className="flex gap-2">
                <button onClick={handleShare} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                  <Share2 size={18} />
                </button>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#0088cc] hover:opacity-90 flex items-center justify-center text-white transition-opacity">
                  <Send size={18} className="mr-0.5" />
                </a>
                <a href={`https://api.whatsapp.com/send?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#25D366] hover:opacity-90 flex items-center justify-center text-white transition-opacity">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1877F2] hover:opacity-90 flex items-center justify-center text-white transition-opacity">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
      {/* Translation Modal */}
      <TranslationModal 
        isOpen={isTranslationModalOpen}
        onClose={() => setIsTranslationModalOpen(false)}
        resumes={userResumes}
        targetLanguages={allLanguages}
      />
    </div>
  );
}

import { use } from 'react';

export default function VacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Загрузка...</div>}>
      <VacancyDetailContent id={id} />
    </Suspense>
  );
}
