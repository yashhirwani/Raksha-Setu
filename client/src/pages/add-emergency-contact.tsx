import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { toast as toastHelper } from '@/hooks/use-toast';

export default function AddEmergencyContact() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // basic validation
    if (!name.trim() || !phone.trim()) {
      toastHelper({ title: t('error'), description: t('fill_required') });
      return;
    }

    setIsSubmitting(true);
    try {
      const touristId = localStorage.getItem('currentTouristId');
      const payload = { touristId, name, phone, relationship, isPrimary: false } as any;
      const res = await fetch('/api/emergency-contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to save contact');
      await res.json();
      toastHelper({ title: t('success'), description: t('contact_added') });
      navigate('/profile');
    } catch (err: any) {
      toastHelper({ title: t('error'), description: err?.message || t('contact_add_failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-3">{t('add_emergency_contact')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm">{t('full_name')}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
              </div>

              <div>
                <label className="text-sm">{t('phone')}</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-2 border rounded" />
              </div>

              <div>
                <label className="text-sm">{t('relationship')}</label>
                <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className="w-full mt-1 p-2 border rounded" />
              </div>

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate('/profile')}>{t('cancel')}</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('saving') : t('complete')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
