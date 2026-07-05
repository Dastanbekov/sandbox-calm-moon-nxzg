'use client';

import React from 'react';

interface LanguageSelectorProps {
  onSelect: (lang: string) => void;
}

const languages = [
  { code: 'en', label: 'ENG' },
  { code: 'ru', label: 'РУС' },
  { code: 'ky', label: 'КЫР' },
];

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const [selected, setSelected] = React.useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Язык вакансии</h1>
        <p className="text-center text-gray-500 mb-6">
          Выберите на каком языке хотите разместить вакансию
        </p>
        <div className="flex flex-col gap-4">
          {languages.map((lang) => (
            <label
              key={lang.code}
              className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                selected === lang.code
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="postingLanguage"
                value={lang.code}
                checked={selected === lang.code}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-lg font-semibold">{lang.label}</span>
            </label>
          ))}
        </div>
        {selected && (
          <p className="text-sm text-center text-gray-400 mt-4">
            Вы выбрали {languages.find((l) => l.code === selected)?.label}.
            Нажмите кнопку для продолжения.
          </p>
        )}
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className={`mt-6 w-full py-3 rounded-xl font-semibold transition ${
            selected
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
