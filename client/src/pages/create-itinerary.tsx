import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export default function CreateItinerary() {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const [title, setTitle] = useState('');
  const [days, setDays] = useState<Array<{ day: number; activities: string }>>([{ day: 1, activities: '' }]);

  function addDay() {
    setDays(d => [...d, { day: d.length + 1, activities: '' }]);
  }

  function removeDay(index: number) {
    setDays(d => d.filter((_, i) => i !== index).map((x, i) => ({ ...x, day: i + 1 })));
  }

  function updateDay(index: number, value: string) {
    setDays(d => d.map((x, i) => i === index ? { ...x, activities: value } : x));
  }

  async function submit() {
  const contentLines: string[] = [];
  contentLines.push(`# ${title || t('unnamed_trip')}`);
    for (const d of days) {
      contentLines.push(`\nDay ${d.day}:`);
      contentLines.push(d.activities || '-');
    }
    const blob = new Blob([contentLines.join('\n')], { type: 'text/plain' });
    const file = new File([blob], (title || 'itinerary') + '.txt', { type: 'text/plain' });
    const fd = new FormData();
    const touristId = localStorage.getItem('currentTouristId') || 'demo-tourist-1';
    fd.append('touristId', touristId);
    fd.append('itinerary', file as any);
    fd.append('itineraryName', title || 'Itinerary');

    try {
      const res = await fetch('/api/trip-itineraries', { method: 'POST', body: fd as any });
      const trip = await res.json();
      // navigate to map and show the map so users can see created trip
      navigate('/map');
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="p-4 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">{t('create_itinerary')}</h1>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>{t('cancel')}</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('itinerary_name_placeholder')} className="w-full p-2 rounded border" />

            {days.map((d, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t('day')} {d.day}</div>
                  <div>
                    {days.length > 1 && <button className="px-2 py-1 rounded bg-muted" onClick={() => removeDay(i)}>{t('remove')}</button>}
                  </div>
                </div>
                <textarea value={d.activities} onChange={e => updateDay(i, e.target.value)} rows={4} className="w-full p-2 rounded border" placeholder={t('itinerary_day_placeholder')} />
              </div>
            ))}

            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 rounded bg-primary text-primary-foreground" onClick={addDay}>{t('add_day')}</button>
              <Button onClick={submit}>{t('create')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
