'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resumesService } from '@/services/resumes.service';
import { Resume } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Mail,
  Phone,
  MessageSquare,
  Lock,
  Download,
  User as UserIcon,
  GraduationCap,
  Layers,
  Award,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getImageUrl } from '@/lib/utils';

function ResumeDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await resumesService.getResume(Number(id));
        setResume(data);
      } catch (error) {
        console.error("Error fetching resume details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchResume();
  }, [id]);

  useEffect(() => {
    if (!isLoading && !isAuthLoading && resume) {
      if (user?.user_type !== 'employer' && user?.id !== resume.user_id) {
        router.push('/resumes');
      }
    }
  }, [isLoading, isAuthLoading, user, resume, router]);

  if (isLoading || isAuthLoading) return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Загрузка...</div>;
  if (!resume) return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Резюме не найдено</div>;
  if (user?.user_type !== 'employer' && user?.id !== resume.user_id) return <div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Доступ закрыт</div>;

  const handleInvite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?next=/resumes/${id}`);
      return;
    }
    if (user.user_type === 'worker') {
      alert('Приглашать могут только работодатели');
      return;
    }
    alert('Функция приглашения в разработке');
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Функция сообщений в разработке');
  };

  const name = resume.profile?.name || resume.name || 'Пользователь';
  const sname = resume.profile?.sname || resume.sname || '';
  const fullName = `${name} ${sname}`.trim();

  const birthDate = resume.profile?.date_of_birth || resume.date_of_birth ? new Date((resume.profile?.date_of_birth || resume.date_of_birth) as string) : null;
  const age = birthDate ? Math.floor((new Date().getTime() - birthDate.getTime()) / 31557600000) : null;

  const canViewContacts = resume.has_contact_access;

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-8 animate-fadeIn">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link href="/resumes" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          К списку резюме
        </Link>

        {/* Action Buttons (Top Right for Employer) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end mb-6">
          {user?.user_type === 'worker' && user?.id === resume.user_id ? (
            <Link href={`/resumes/${id}/edit`} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm">
              Редактировать резюме
            </Link>
          ) : (
            <>
              <button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm shadow-blue-600/20">
                Пригласить
              </button>
              <button onClick={handleMessage} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                <MessageSquare size={18} className="text-gray-500" />
                Сообщение
              </button>
            </>
          )}
        </div>

        {/* CV Container */}
        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Sidebar (Dark or tinted) */}
          <div className="w-full md:w-1/3 bg-slate-50 p-8 border-r border-gray-100 flex flex-col">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden mb-4">
                {resume.photo ? (
                  <img src={getImageUrl(resume.photo)} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={64} className="text-gray-300" strokeWidth={1} />
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">
                {fullName}
              </h1>
              <h2 className="text-blue-600 font-semibold text-lg mb-4">
                {resume.career_objective || 'Желаемая должность не указана'}
              </h2>
              
              <div className="text-gray-500 text-sm space-y-2">
                {resume.city_detail && (
                  <div className="flex items-center justify-center gap-1.5"><MapPin size={16} /> {resume.city_detail.title}</div>
                )}
                {birthDate && (
                  <div className="flex items-center justify-center gap-1.5"><Calendar size={16} /> {format(birthDate, 'dd.MM.yyyy')} ({age} {age === 1 ? 'год' : (age && age >= 2 && age <= 4) ? 'года' : 'лет'})</div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Contacts */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Контакты</h3>
                <div className="relative">
                  {!canViewContacts && (
                    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-2 text-center rounded-xl border border-dashed border-gray-200">
                      <Lock size={16} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-medium">Контакты скрыты</span>
                    </div>
                  )}
                  <div className={`space-y-3 ${!canViewContacts ? 'opacity-20 pointer-events-none' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <div className="pt-1 text-sm text-gray-700 font-medium break-all">
                        {resume.phone ? <a href={`tel:${resume.phone}`} className="hover:text-blue-600">{resume.phone}</a> : 'Не указан'}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Mail size={14} />
                      </div>
                      <div className="pt-1 text-sm text-gray-700 font-medium break-all">
                        {resume.email ? <a href={`mailto:${resume.email}`} className="hover:text-blue-600">{resume.email}</a> : 'Не указан'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages */}
              {resume.resume_languages && resume.resume_languages.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Языки</h3>
                  <div className="space-y-3">
                    {resume.resume_languages.map((l: any, i: number) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="font-medium text-gray-900 text-sm mb-1">{l.language_detail?.title}</div>
                        <div className="text-xs text-blue-600">{l.proficiency_detail?.title || l.language_proficiency}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.key_skills && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Навыки</h3>
                  <div className="flex flex-wrap gap-2">
                    {resume.key_skills.split(',').filter(Boolean).map((skill: string, idx: number) => (
                      <span key={idx} className="px-3 py-1.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-medium shadow-sm">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-8">
               {canViewContacts && (
                  <button className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                    <Download size={16} />
                    Скачать PDF
                  </button>
               )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="w-full md:w-2/3 p-8 md:p-12">
            
            {/* Header / Summary stats */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
              <div>
                <span className="text-3xl font-bold text-gray-900">
                  {canViewContacts ? (resume.salary ? `${resume.salary} KGS` : 'По договоренности') : 'Зарплата скрыта'}
                </span>
                {canViewContacts && resume.salary && <span className="text-gray-500 text-sm ml-2">на руки</span>}
              </div>
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
                <Briefcase size={16} />
                {resume.busyness_detail?.title || 'Занятость не указана'}
              </div>
            </div>

            <div className="space-y-12">
              
              {/* About */}
              {resume.about_me && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <UserIcon size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">О себе</h3>
                  </div>
                  <div className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap pl-13">
                    {resume.about_me}
                  </div>
                </section>
              )}

              {/* Experience */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Опыт работы</h3>
                </div>
                
                {!resume.work_experiences || resume.work_experiences.length === 0 ? (
                  <p className="text-gray-500 italic pl-13">Опыт работы не указан.</p>
                ) : (
                  <div className="relative border-l-2 border-gray-100 ml-[19px] pl-8 space-y-10">
                    {resume.work_experiences.map((exp, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute w-4 h-4 bg-orange-500 rounded-full -left-[39px] top-1.5 border-4 border-white shadow-sm"></div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{exp.position}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                          <span className="font-bold text-blue-600">{exp.company_name}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {format(new Date(exp.exp_start_work || exp.start_date), 'LLLL yyyy', { locale: ru })} — 
                            {exp.exp_end_work || exp.end_date ? ' ' + format(new Date(exp.exp_end_work || exp.end_date), 'LLLL yyyy', { locale: ru }) : ' Настоящее время'}
                          </span>
                        </div>
                        <div className="text-gray-600 text-[15px] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100" dangerouslySetInnerHTML={{ __html: exp.duties || '' }} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Education */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Образование</h3>
                </div>
                
                {!resume.institutions || resume.institutions.length === 0 ? (
                  <p className="text-gray-500 italic pl-13">Образование не указано.</p>
                ) : (
                  <div className="space-y-6 pl-13">
                    {resume.institutions.map((edu: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{edu.institution_name}</h4>
                          <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">{edu.inst_end_study}</span>
                        </div>
                        <p className="text-gray-700 font-medium mb-1">{edu.specialization}</p>
                        {edu.faculty && <p className="text-gray-500 text-sm">Факультет: {edu.faculty}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Extra Education */}
              {resume.extra_institutions && resume.extra_institutions.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Award size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Курсы и тренинги</h3>
                  </div>
                  <div className="space-y-4 pl-13">
                    {resume.extra_institutions.map((edu: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                          <BookOpen size={18} className="text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{edu.extra_inst_title}</h4>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <span>{edu.extra_inst_organizer}</span>
                            {edu.extra_inst_date && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{edu.extra_inst_date} г.</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Attachments */}
              {(resume.file1 || resume.file2 || resume.file3) && canViewContacts && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Портфолио и файлы</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-13">
                    {[
                      { file: resume.file1, name: resume.filename1 },
                      { file: resume.file2, name: resume.filename2 },
                      { file: resume.file3, name: resume.filename3 }
                    ].filter(f => f.file).map((item: any, idx: number) => (
                      <a key={idx} href={getImageUrl(item.file)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                          <Download size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">{item.name || `Прикрепленный файл ${idx + 1}`}</p>
                          <p className="text-xs text-gray-500">Нажмите чтобы скачать</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { use } from 'react';

export default function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="max-w-[1200px] mx-auto px-4 py-20 text-center text-gray-500 font-medium">Загрузка...</div>}>
      <ResumeDetailContent id={id} />
    </Suspense>
  );
}
