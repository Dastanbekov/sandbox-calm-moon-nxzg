'use client';

import { getImageUrl } from '@/lib/utils';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { companiesService, Company, CompanyFilters } from '@/services/companies.service';
import { lookupsService } from '@/services/lookups.service';
import { Lookups } from '@/types';
import VerifiedBadge from '@/components/VerifiedBadge';

function CompaniesList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [lookups, setLookups] = useState<Lookups | null>(null);

  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city_id') || '');
  const [selectedScope, setSelectedScope] = useState(searchParams.get('scope_id') || '');
  const [withVacancies, setWithVacancies] = useState(searchParams.get('with_vacancies') === '1');
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    lookupsService.getLookups().then(data => setLookups(data)).catch(() => {});
  }, []);

  const fetchCompanies = async (pageNum = 1, append = false) => {
    try {
      const filters: CompanyFilters = { page: pageNum };
      if (query) filters.query = query;
      if (selectedCity) filters.city_id = selectedCity;
      if (selectedScope) filters.scope_id = selectedScope;
      if (withVacancies) filters.with_vacancies = 1;

      const res = await companiesService.getCompanies(filters);
      if (append) {
        setCompanies(prev => [...prev, ...(res.results || [])]);
      } else {
        setCompanies(res.results || []);
      }
      setTotal(res.count || 0);
      setHasMore(!!res.next);
    } catch {
      if (!append) setCompanies([]);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCompanies(1, false);
  }, [searchParams]);

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (selectedCity) params.set('city_id', selectedCity);
    if (selectedScope) params.set('scope_id', selectedScope);
    if (withVacancies) params.set('with_vacancies', '1');
    router.push(`/companies?${params.toString()}`);
  };

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCompanies(nextPage, true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Работодатели</h1>
            <p className="mt-2 text-slate-500 text-[15px]">Каталог работодателей и открытых вакансий</p>
          </div>

          <form className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" onSubmit={handleFilterSubmit}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider">Найдите по ключевому слову</label>
              <input
                type="text"
                placeholder="Ключевое слово"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onBlur={handleFilterSubmit}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all placeholder-slate-400 text-[15px] shadow-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider">Найдите в определенном городе</label>
              <select
                value={selectedCity}
                onChange={e => { setSelectedCity(e.target.value); setTimeout(handleFilterSubmit, 100); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all text-[15px] shadow-xs"
              >
                <option value="">Все города</option>
                {lookups?.cities.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700 uppercase tracking-wider">Найдите по сфере деятельности</label>
              <select
                value={selectedScope}
                onChange={e => { setSelectedScope(e.target.value); setTimeout(handleFilterSubmit, 100); }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-[#4452c9] focus:outline-none focus:ring-2 focus:ring-[#4452c9]/10 transition-all text-[15px] shadow-xs"
              >
                <option value="">Все сферы</option>
                {lookups?.scopes.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="flex items-center lg:pt-6">
              <label className="flex items-center gap-2.5 text-[15px] text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withVacancies}
                  onChange={(e) => { setWithVacancies(e.target.checked); setTimeout(handleFilterSubmit, 100); }}
                  className="h-5 w-5 rounded border-slate-300 text-[#4452c9] focus:ring-[#4452c9] transition-all cursor-pointer"
                />
                <span className="font-medium">С открытыми вакансиями</span>
              </label>
            </div>
            <button type="submit" style={{ display: 'none' }}></button>
          </form>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <p className="text-slate-600 text-[15px]">
                Найдено компаний: <span className="font-bold text-[#4452c9]">{total}</span>
              </p>
            </div>

            <div className="mt-4">
              <ul className="space-y-4">
                {companies.map((company, idx) => (
                  <li key={company.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                        {company.logo ? (
                          <img src={getImageUrl(company.logo)} alt={company.title} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <img src="/img/png/logo.png" alt="No logo" className="max-h-full max-w-full object-contain" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-bold text-slate-900 hover:text-[#4452c9] transition-colors leading-snug truncate flex items-center gap-1">
                          <Link href={`/companies/${company.id}`}>{company.title}</Link>
                          {company.is_verified && <VerifiedBadge className="w-5 h-5 flex-shrink-0" />}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 font-medium truncate">
                          {company.city_detail?.title || ''} 
                          {company.city_detail && company.scope_detail ? ', ' : ''}
                          {company.scope_detail?.title || ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end justify-center gap-1.5">
                      {company.vacancy_count !== undefined && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-all">
                          <Link href={`/vacancies?query=${company.title}`}>
                            {company.vacancy_count} {company.vacancy_count === 1 ? 'вакансия' : (company.vacancy_count > 1 && company.vacancy_count < 5 ? 'вакансии' : 'вакансий')}
                          </Link>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <a 
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[15px] rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer" 
                  href="#" 
                  onClick={handleLoadMore}
                >
                  Показать еще
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-slate-500 font-medium text-lg">Загрузка...</div>}>
      <CompaniesList />
    </Suspense>
  );
}
