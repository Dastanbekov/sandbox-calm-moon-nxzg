'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { articlesService, Article } from '@/services/articles.service';
import { ArrowLeft, Clock, Newspaper, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      Promise.all([
        articlesService.getArticle(Number(params.id)),
        articlesService.getRelatedArticles(8),
      ])
        .then(([art, rel]) => {
          setArticle(art);
          setRelated(rel.filter(r => r.id !== art.id).slice(0, 6));
        })
        .catch(() => setError('Статья не найдена или недоступна.'))
        .finally(() => setIsLoading(false));
    }
  }, [params.id]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md w-full">
          <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ошибка</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/articles" className="inline-block bg-blue-600 text-white font-medium py-2.5 px-6 rounded-xl hover:bg-blue-700 transition-colors">
            К статьям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} className="mr-1" /> Статьи
        </button>

        {/* Main article */}
        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          {article.image && (
            <div className="aspect-video max-h-80 overflow-hidden">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
              <Clock size={14} />
              <span>{formatDate(article.created_at)}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-8">
              {article.title}
            </h1>

            {article.body && (
              <div
                className="prose prose-slate prose-lg max-w-none prose-p:leading-relaxed prose-a:text-blue-600 prose-headings:font-bold prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
            )}

            {/* Source */}
            {(article.url || article.source) && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-slate-500">
                <span>Источник:</span>
                {article.url ? (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                    {article.source || article.url}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">{article.source}</span>
                )}
              </div>
            )}
          </div>
        </article>

        {/* Related articles */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Похожие статьи</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(art => (
                <Link key={art.id} href={`/articles/${art.id}`} className="block group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-200 transition-all h-full flex flex-col">
                    <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
                      {art.image ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Newspaper className="text-blue-200" size={32} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm leading-snug mb-2 line-clamp-2 flex-1">
                        {art.title}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-slate-400">{formatDate(art.created_at)}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
