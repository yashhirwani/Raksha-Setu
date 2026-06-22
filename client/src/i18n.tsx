// Clean I18n provider (single definitive copy).
// This file intentionally keeps translations in JSON files under ./translations
// to avoid large inlined objects in TypeScript source which can cause merge
// or duplication issues.

import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './translations/en.json';
import hiTranslations from './translations/hi.json';

type Lang = 'en' | 'hi';

const translations: Record<Lang, Record<string, string>> = {
  en: enTranslations as Record<string, string>,
  hi: hiTranslations as Record<string, string>,
};

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  translateFallbackEnabled: boolean;
  setTranslateFallbackEnabled: (v: boolean) => void;
}>({
  lang: 'en',
  setLang: () => {},
  t: (k: string) => k,
  translateFallbackEnabled: false,
  setTranslateFallbackEnabled: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>((localStorage.getItem('lang') as Lang) || 'en');
  const [translateFallbackEnabled, setTranslateFallbackEnabled] = useState<boolean>(localStorage.getItem('translateFallback') === '1');

  useEffect(() => { try { localStorage.setItem('translateFallback', translateFallbackEnabled ? '1' : '0'); } catch (e) {} }, [translateFallbackEnabled]);

  const setLangPersist = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem('lang', l); } catch (e) {}
  };

  const fetched: Record<string, string> = JSON.parse(localStorage.getItem('fetchedTranslations') || '{}');

  const saveFetched = (key: string, val: string) => {
    fetched[key] = val;
    try { localStorage.setItem('fetchedTranslations', JSON.stringify(fetched)); } catch (e) {}
  };

  const fetchTranslation = async (key: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: translations['en'][key] ?? key, target: lang }) });
      if (!res.ok) return null;
      const data = await res.json();
      return (data.translated ?? data.translatedText) ?? null;
    } catch (err) {
      return null;
    }
  };

  const prettify = (val: string) => String(val)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

  const t = (k: string) => {
    const localRaw = translations[lang]?.[k];
    if (localRaw) {
      return (localRaw.includes('_') || /[a-z][A-Z]/.test(localRaw)) ? prettify(localRaw) : localRaw;
    }
    const en = translations['en']?.[k];
    if (en && translateFallbackEnabled) {
      const cached = fetched[k];
      if (cached) return cached.includes('_') || /[a-z][A-Z]/.test(cached) ? prettify(cached) : cached;
      fetchTranslation(k).then(tval => { if (tval) saveFetched(k, tval); });
      return en.includes('_') || /[a-z][A-Z]/.test(en) ? prettify(en) : en;
    }
    const base = en ?? k;
    return prettify(base);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangPersist, t, translateFallbackEnabled, setTranslateFallbackEnabled }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
