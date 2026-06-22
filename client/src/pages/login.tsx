import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n';
import { verifyCredential } from '@/lib/auth';

function maskId(id: string) {
  if (!id) return '';
  if (id.length <= 4) return id;
  return id.slice(0, 2) + '•••' + id.slice(-2);
}

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [verifiedTourist, setVerifiedTourist] = useState<any | null>(null);
  const { t, lang, setLang } = useI18n();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber || !password) {
      toast({ title: t('error'), description: t('login_error_enter_id'), variant: 'destructive' });
      return;
    }

    try {
      const ok = await verifyCredential(idNumber, password);
      if (!ok) {
        toast({ title: t('error'), description: t('wrong_credentials'), variant: 'destructive' });
        return;
      }

      const res = await fetch(`/api/tourists/id-number/${encodeURIComponent(idNumber)}`);
      if (!res.ok) {
        toast({ title: t('not_found'), description: t('login_not_found_desc'), variant: 'destructive' });
        return;
      }
      const tdata = await res.json();
      setVerifiedTourist(tdata);
    } catch (e) {
      toast({ title: t('error'), description: t('login_failed'), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-6 bg-card p-6 rounded-2xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{t('login_title')}</h2>
            <p className="text-sm text-muted-foreground">{t('login_subtitle')}</p>
          </div>
          <div>
            <select value={lang} onChange={(e) => setLang(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="en">{t('english')}</option>
              <option value="hi">{t('hindi')}</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">{t('id_number')}</label>
          <Input placeholder={t('passport_or_aadhaar_placeholder')} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-card-foreground">{t('password_label')}</label>
          <Input placeholder={t('password_placeholder')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <Button type="submit">{t('login_button')}</Button>
          <Button variant="link" onClick={() => navigate('/')}>{t('create_account')}</Button>
        </div>

        {verifiedTourist && (
          <div className="mt-4 border p-4 rounded bg-muted">
            <p className="text-sm text-muted-foreground">{t('verified_id_preview')}</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-sm font-medium">{verifiedTourist.name}</p>
                <p className="text-xs text-muted-foreground">{maskId(verifiedTourist.idNumber)}</p>
              </div>
              <div className="ml-4">
                <Button onClick={() => {
                  localStorage.setItem('currentTouristId', verifiedTourist.id);
                  navigate(`/digital-id/${verifiedTourist.id}`);
                }}>{t('generate_digital_id')}</Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
