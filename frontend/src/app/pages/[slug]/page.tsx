'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/auth.service';
import { FileText, AlertCircle } from 'lucide-react';

interface CmsPage {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface StaticPageProps {
  params: { slug: string };
}

// Static fallback content for common pages
const STATIC_CONTENT: Record<string, { title: string; content: string }> = {
  'about': {
    title: 'О нас',
    content: `<p>Employment.kg — ведущий портал по поиску работы и сотрудников в Кыргызстане.</p>
    <p>Мы помогаем соискателям найти работу мечты, а работодателям — квалифицированных специалистов.</p>
    <h3>Наши преимущества</h3>
    <ul>
      <li>Тысячи актуальных вакансий</li>
      <li>База резюме квалифицированных специалистов</li>
      <li>Удобные инструменты для работодателей</li>
      <li>Тренинги и курсы для профессионального развития</li>
    </ul>`,
  },
  'contacts': {
    title: 'Контакты',
    content: `<p><strong>ОсОО "Эмплоймент.кг"</strong></p>
    <p>ИНН: 02804201610481</p>
    <p>Адрес: г. Бишкек, ул. Тимирязева 99/27</p>
    <p>Телефон: <a href="tel:+996772267490">+996 772 267 490</a></p>
    <p>Email: <a href="mailto:info@employment.kg">info@employment.kg</a></p>`,
  },
};

export default function StaticPageContent({ params }: StaticPageProps) {
  const [page, setPage] = useState<CmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { slug } = params;

  useEffect(() => {
    api.get<CmsPage>(`/api/cms/pages/${slug}/`)
      .then(res => setPage(res.data))
      .catch(() => {
        const fallback = STATIC_CONTENT[slug];
        if (fallback) {
          setPage({ id: 0, name: fallback.title, slug, description: fallback.content });
        } else {
          setError('Страница не найдена.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Страница не найдена</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-blue-200" size={24} />
              <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">Информация</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{page.name}</h1>
          </div>

          <div className="p-8 md:p-12">
            {page.description ? (
              <div
                className="prose prose-slate prose-lg max-w-none prose-p:leading-relaxed prose-a:text-blue-600 prose-headings:font-bold prose-headings:text-slate-800 prose-li:text-slate-700"
                dangerouslySetInnerHTML={{ __html: page.description }}
              />
            ) : (
              <p className="text-slate-500 text-center py-8">Содержимое страницы отсутствует.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
