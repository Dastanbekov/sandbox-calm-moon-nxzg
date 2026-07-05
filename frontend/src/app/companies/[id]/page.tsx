'use client';

import { getImageUrl } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { companiesService, Company } from '@/services/companies.service';
import { Vacancy } from '@/types';
import { ArrowLeft, Building2, MapPin, Phone, Globe, User, Briefcase, AlertCircle, ExternalLink, Mail } from 'lucide-react';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [company, setCompany] = useState<(Company & { vacancies?: Vacancy[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      companiesService.getCompany(Number(params.id))
        .then(data => setCompany(data))
        .catch(() => setError('Компания не найдена.'))
        .finally(() => setIsLoading(false));
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md w-full">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ошибка</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/companies" className="inline-block bg-blue-600 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors">
            К списку компаний
          </Link>
        </div>
      </div>
    );
  }

  const siteUrl = company.site
    ? (company.site.startsWith('http') ? company.site : `http://${company.site}`)
    : null;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-1" /> К списку компаний
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-8 md:p-10 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                {company.logo ? (
                  <img src={getImageUrl(company.logo)} alt={company.title} className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="text-slate-400" size={40} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    {company.title}
                    {company.is_verified && <VerifiedBadge className="w-7 h-7 flex-shrink-0" />}
                  </h1>
                  {company.is_leading && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      Ведущий работодатель
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-slate-600 mt-3">
                  {company.city_detail && (
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <MapPin size={14} className="text-slate-400" />{company.city_detail.title}
                    </span>
                  )}
                  {company.scope_detail && (
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <Briefcase size={14} className="text-slate-400" />{company.scope_detail.title}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              {company.fio && company.show_fio && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <User size={16} className="text-blue-400 flex-shrink-0" />
                  <div><span className="text-slate-500">Контактное лицо:</span> <span className="font-medium text-slate-800">{company.fio}</span></div>
                </div>
              )}
              {company.phone && company.show_phone && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone size={16} className="text-blue-400 flex-shrink-0" />
                  <a href={`tel:${company.phone}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors">{company.phone}</a>
                </div>
              )}
              {company.email && company.show_email && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Mail size={16} className="text-blue-400 flex-shrink-0" />
                  <a href={`mailto:${company.email}`} className="font-medium text-slate-800 hover:text-blue-600 transition-colors">{company.email}</a>
                </div>
              )}
              {siteUrl && company.show_site && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Globe size={16} className="text-blue-400 flex-shrink-0" />
                  <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                    {company.site} <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <MapPin size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="text-slate-700">{company.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          {company.about_company && (
            <div className="p-8 md:p-10 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Описание компании</h2>
              <div
                className="prose prose-slate max-w-none prose-p:leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ __html: company.about_company }}
              />
            </div>
          )}

          {/* Map */}
          {company.google_map_code && (
            <div className="p-8 md:p-10 border-b border-gray-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-blue-500" />
                Мы на карте
              </h2>
              <div className="w-full h-[350px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
                {(() => {
                  if (company.google_map_code.includes('<iframe')) {
                    return (
                      <div 
                        className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:absolute [&>iframe]:inset-0 [&>a]:hidden" 
                        dangerouslySetInnerHTML={{ __html: company.google_map_code }} 
                      />
                    );
                  }
                  
                  if (company.google_map_code.includes(',') && !company.google_map_code.includes('/')) {
                    const coords = company.google_map_code.split(',');
                    const lat = parseFloat(coords[0]);
                    const lng = parseFloat(coords[1]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      const src = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                      return <iframe src={src} className="w-full h-full border-0 absolute inset-0" allowFullScreen />;
                    }
                  }

                  return <iframe src={company.google_map_code} className="w-full h-full border-0 absolute inset-0" allowFullScreen />;
                })()}
              </div>
            </div>
          )}

          {/* Company Vacancies */}
          {company.vacancies && company.vacancies.length > 0 && (
            <div className="p-8 md:p-10">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Вакансии компании ({company.vacancies.length})
              </h2>
              <div className="space-y-3">
                {company.vacancies.map((vacancy: any) => (
                  <Link key={vacancy.id} href={`/vacancies/${vacancy.id}`} className="block group">
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {company.logo ? (
                          <img src={getImageUrl(company.logo)} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="text-slate-400" size={16} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">{vacancy.position}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                          {vacancy.city_detail && <span>{vacancy.city_detail.title}</span>}
                          {vacancy.busyness_detail && <><span>·</span><span>{vacancy.busyness_detail.title}</span></>}
                        </div>
                      </div>
                      {(vacancy.wages_from || vacancy.wages_to) && (
                        <div className="text-sm font-bold text-green-600 flex-shrink-0">
                          {vacancy.wages_from && `от ${Number(vacancy.wages_from).toLocaleString()}`}
                          {vacancy.wages_to && ` до ${Number(vacancy.wages_to).toLocaleString()}`}
                          {' '}KGS
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
