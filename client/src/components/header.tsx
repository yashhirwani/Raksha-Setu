import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { apiRequest } from '@/lib/queryClient';
import LanguageSwitcher from './language-switcher';

export default function Header() {
  const { t } = useI18n();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('currentTouristId');
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tourists/${id}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.logoUrl) setLogoUrl(data.logoUrl);
      } catch (err) {
        // ignore
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const tourist = e?.detail;
        if (tourist?.logoUrl) setLogoUrl(tourist.logoUrl);
        else {
          const id = localStorage.getItem('currentTouristId');
          if (!id) return;
          fetch(`/api/tourists/${id}`, { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => { if (d?.logoUrl) setLogoUrl(d.logoUrl); });
        }
      } catch (err) {}
    };
    window.addEventListener('tourist:changed', handler as EventListener);
    return () => { window.removeEventListener('tourist:changed', handler as EventListener); };
  }, []);

  return (
    <header className="app-header bg-card p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="object-contain w-full h-full" />
          ) : (
            <img src="/raksha-logo.png" alt="RakshaSetu" className="object-contain w-full h-full" />
          )}
        </div>
        <div>
              <div className="text-lg font-bold">{t('app_title')}</div>
              <div className="text-xs text-muted-foreground">{t('app_subtitle')}</div>
        </div>
      </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
    </header>
  );
}
