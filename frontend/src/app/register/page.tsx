'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'worker' | 'employer'>('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to home page
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.register({
        email,
        name,
        password,
        user_type: userType,
      });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      // Extract error details
      const errData = err.response?.data;
      let errMsg = 'Произошла ошибка при регистрации.';
      if (errData) {
        if (typeof errData === 'object') {
          // Join validation errors
          errMsg = Object.values(errData).flat().join(' ') || errMsg;
        } else {
          errMsg = errData;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте новый аккаунт на портале</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.tabsGroup}>
            <label className={styles.label}>Кто вы?</label>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tab} ${userType === 'worker' ? styles.tabActive : ''}`}
                onClick={() => setUserType('worker')}
              >
                Соискатель
              </button>
              <button
                type="button"
                className={`${styles.tab} ${userType === 'employer' ? styles.tabActive : ''}`}
                onClick={() => setUserType('employer')}
              >
                Работодатель
              </button>
            </div>
          </div>

          <div className={styles.group}>
            <label htmlFor="name" className={styles.label}>
              {userType === 'employer' ? 'Название компании' : 'Ваше имя'}
            </label>
            <input
              id="name"
              type="text"
              required
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={userType === 'employer' ? 'ОсОО Вектор' : 'Алексей Иванов'}
            />
          </div>

          <div className={styles.group}>
            <label htmlFor="email" className={styles.label}>
              Email адрес
            </label>
            <input
              id="email"
              type="email"
              required
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.group}>
            <label htmlFor="password" className={styles.label}>
              Пароль (мин. 8 символов)
            </label>
            <input
              id="password"
              type="password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Уже есть аккаунт? </span>
          <Link href="/auth/login" className={styles.footerLink}>
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
