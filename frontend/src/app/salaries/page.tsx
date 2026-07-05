'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Search, 
  MapPin, 
  BarChart3, 
  ChevronDown, 
  ArrowUpRight, 
  Briefcase,
  Users
} from 'lucide-react';

export default function SalariesAnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for UI demonstration
  const trendingRoles = [
    { role: 'Frontend-разработчик', avg: 85000, min: 40000, max: 150000, growth: '+15%' },
    { role: 'Backend-разработчик', avg: 95000, min: 50000, max: 180000, growth: '+12%' },
    { role: 'UX/UI Дизайнер', avg: 70000, min: 35000, max: 120000, growth: '+8%' },
    { role: 'Менеджер по продажам', avg: 60000, min: 30000, max: 200000, growth: '+25%' },
    { role: 'Бухгалтер', avg: 45000, min: 25000, max: 80000, growth: '+5%' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-10 md:p-16 text-white relative overflow-hidden mb-10 shadow-lg">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <BarChart3 size={16} className="text-blue-200" />
              Аналитика рынка труда
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Сколько платят специалистам в Кыргызстане?
            </h1>
            <p className="text-blue-100 text-lg mb-10 font-medium opacity-90 max-w-xl">
              Узнайте реальные зарплаты на рынке. Данные основаны на анализе 10,000+ вакансий и резюме за последний месяц.
            </p>

            <div className="bg-white p-2 rounded-2xl flex items-center shadow-2xl max-w-lg focus-within:ring-4 focus-within:ring-white/20 transition-all">
              <div className="pl-4 pr-2 text-gray-400">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Профессия или должность..." 
                className="w-full py-3 px-2 text-gray-900 bg-transparent border-none outline-none font-medium placeholder-gray-400 text-[15px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                Узнать
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="text-green-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Средняя з/п по рынку</p>
              <h3 className="text-2xl font-black text-gray-900">42,500 <span className="text-base text-gray-400 font-bold">KGS</span></h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <Briefcase className="text-blue-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Проанализировано вакансий</p>
              <h3 className="text-2xl font-black text-gray-900">12,450</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="text-indigo-600" size={28} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Проанализировано резюме</p>
              <h3 className="text-2xl font-black text-gray-900">34,120</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Популярные профессии</h2>
              <button className="text-blue-600 font-medium hover:underline text-sm">
                Смотреть все
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-5 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-5">Профессия</div>
                <div className="col-span-3 text-center">Средняя (KGS)</div>
                <div className="col-span-3 text-center">Диапазон (от-до)</div>
                <div className="col-span-1 text-right">Рост</div>
              </div>

              <div className="divide-y divide-gray-50">
                {trendingRoles.map((role, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/50 transition-colors">
                    <div className="col-span-5 font-bold text-gray-900">{role.role}</div>
                    <div className="col-span-3 text-center font-bold text-blue-600 text-lg">
                      {role.avg.toLocaleString()}
                    </div>
                    <div className="col-span-3 text-center text-sm font-medium text-gray-500">
                      {role.min.toLocaleString()} — {role.max.toLocaleString()}
                    </div>
                    <div className="col-span-1 text-right text-sm font-bold text-green-600 flex items-center justify-end gap-0.5">
                      <ArrowUpRight size={14} />
                      {role.growth}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Инструменты</h2>
            
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Для работодателей</h3>
              <p className="text-sm text-gray-500 mb-6">Оцените, какую зарплату предложить кандидату, чтобы вакансия была конкурентной, но не переплачивая.</p>
              <Link href="/cabinet" className="w-full block text-center bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition-colors">
                Перейти в кабинет
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Для соискателей</h3>
              <p className="text-sm text-gray-500 mb-6">Узнайте, сколько вы стоите на рынке труда, и смело просите повышение на текущей работе.</p>
              <Link href="/resumes" className="w-full block text-center bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-xl transition-colors">
                Создать резюме
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
