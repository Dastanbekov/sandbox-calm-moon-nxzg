'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { articlesService, Article } from '@/services/articles.service';
import { Clock, Newspaper, AlertCircle, ChevronRight } from 'lucide-react';

function ArticlesList() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchArticles = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await articlesService.getArticles(p);
      if (p === 1) {
        setArticles(res.results || []);
      } else {
        setArticles(prev => [...prev, ...(res.results || [])]);
      }
      setTotal(res.count || 0);
      setHasMore(!!res.next);
    } catch {
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(1);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchArticles(next);
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Полезное</h1>
          <p className="mt-2 text-slate-500 text-lg">Статьи, советы и новости рынка труда</p>
        </div>

        {isLoading && articles.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Статей пока нет</h3>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {articles.map((article, idx) => (
                <Link key={article.id} href={`/articles/${article.id}`} className="block group">
                  <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col sm:flex-row gap-0 ${idx === 0 ? 'flex-col' : ''}`}>
                    {/* Image */}
                    {idx === 0 ? (
                      // Featured article - large image
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
                        {article.image ? (
                          <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Newspaper className="text-blue-200" size={64} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                          Главная статья
                        </div>
                      </div>
                    ) : (
                      // Regular article - thumbnail
                      <div className="w-full sm:w-48 h-36 sm:h-auto flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
                        {article.image ? (
                          <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Newspaper className="text-blue-200" size={32} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className={`p-6 flex flex-col justify-between flex-1 ${idx === 0 ? 'p-8' : ''}`}>
                      <div>
                        <h2 className={`font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-2 ${idx === 0 ? 'text-2xl' : 'text-base'}`}>
                          {article.title}
                        </h2>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock size={14} />
                          <span>{formatDate(article.created_at)}</span>
                        </div>
                        <span className="text-sm font-medium text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Читать <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="bg-white border border-gray-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 font-semibold px-8 py-3 rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {isLoading ? 'Загрузка...' : 'Показать ещё'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}>
      <ArticlesList />
    </Suspense>
  );
}
