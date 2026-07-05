import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-lg">
        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[160px] md:text-[200px] font-extrabold text-slate-100 leading-none select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div>
              <p className="text-6xl mb-2">🔍</p>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          Страница не найдена
        </h1>
        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            На главную
          </Link>
          <Link
            href="/vacancies"
            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 shadow-sm transition-all hover:-translate-y-0.5"
          >
            Смотреть вакансии
          </Link>
        </div>
      </div>
    </div>
  );
}
