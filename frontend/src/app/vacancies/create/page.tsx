'use client';

import React, { useState } from 'react';
import VacancyForm from '@/components/forms/VacancyForm';
import LanguageSelector from '@/components/forms/LanguageSelector';

export default function CreateVacancyPage() {
  const [postingLanguage, setPostingLanguage] = useState<string | null>(null);

  if (!postingLanguage) {
    return <LanguageSelector onSelect={setPostingLanguage} />;
  }

  return <VacancyForm postingLanguage={postingLanguage} />;
}
