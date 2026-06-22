import React from 'react';
import { useI18n } from '@/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center space-x-2">
      <button
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
        className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
        EN
      </button>
      <button
        aria-pressed={lang === 'hi'}
        onClick={() => setLang('hi')}
        className={`px-2 py-1 rounded ${lang === 'hi' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}>
        HI
      </button>
    </div>
  );
}
