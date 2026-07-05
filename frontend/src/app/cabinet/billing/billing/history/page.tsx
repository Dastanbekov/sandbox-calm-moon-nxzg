'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';

export default function BillingHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.user_type !== 'employer') {
      router.push('/cabinet');
    } else if (user) {
      api.get('/billing/history/')
        .then(res => setData(res.data.results || []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user, router]);

  if (!user || user.user_type !== 'employer') return null;

  return (
    <div className="tab-content">
      <div role="tabpanel" className="tab-pane fade in active">
        <div className="title">
          <div className="pull-left">
            <h2>История платежей</h2>
          </div>
          <div className="pull-right">
            <a href="#" onClick={(e) => { e.preventDefault(); window.print(); }} style={{ color: '#0056b3' }}>
              <i className="fa fa-print" style={{ marginRight: '5px' }}></i>Распечатать
            </a>
          </div>
        </div>

        <div className="categorys my-resumes" style={{ padding: '20px' }}>
          
          {isLoading ? (
            <p>Загрузка...</p>
          ) : data.length === 0 ? (
            <p>У вас пока нет истории платежей.</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Описание</th>
                  <th>Сумма</th>
                  <th>Тип</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td>{new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
                    <td>{item.description}</td>
                    <td style={{ fontWeight: 'bold', color: item.amount > 0 ? 'green' : 'red' }}>
                      {item.amount > 0 ? '+' : ''}{item.amount}
                    </td>
                    <td>
                      {item.amount > 0 ? 'Приход' : 'Расход'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
