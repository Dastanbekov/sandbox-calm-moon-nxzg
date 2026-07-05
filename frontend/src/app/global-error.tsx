'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="relative mb-8">
            <p className="text-[160px] font-extrabold text-slate-100 leading-none select-none">500</p>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-6xl">⚠️</p>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Что-то пошло не так</h1>
          <p className="text-slate-500 text-lg mb-8">
            На сервере произошла ошибка. Попробуйте обновить страницу.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all"
            >
              Попробовать снова
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-all"
            >
              На главную
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
