import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Card, CardContent } from '@/components/ui/card';

export default function TripDetail({ params }: { params: { id: string } }) {
  const [, navigate] = useLocation();
  const [trip, setTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params.id;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${id}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        setTrip(data);
      } catch (e) {
        setTrip(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const { t } = useI18n();

  if (loading) return <div className="p-4">{t('loading_digital_id')}</div>;
  if (!trip) return <div className="p-4">{t('tourist_not_found')}</div>;

  const url = trip.itineraryUrl;
  const isPdf = typeof url === 'string' && url.toLowerCase().endsWith('.pdf');
  const isJson = typeof url === 'string' && url.toLowerCase().endsWith('.json');

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/map')}>{t('back')}</Button>
        <h2 className="text-lg font-semibold">{t('trip')} {trip.id}</h2>
      </div>

      <Card>
        <CardContent>
          <div className="mb-4">
            <div className="text-sm text-muted-foreground">{t('itinerary_name')}: <span className="font-medium">{trip.itineraryName ?? t('unnamed')}</span></div>
            <div className="text-sm text-muted-foreground">{t('status')}: <span className="font-medium">{trip.isActive ? t('active') : t('inactive')}</span></div>
          </div>

          {url ? (
            <div>
              {isPdf && (
                <iframe src={url} title="itinerary-pdf" className="w-full h-[70vh] border" />
              )}

              {isJson && (
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">{JSON.stringify(trip, null, 2)}</pre>
              )}

              {!isPdf && !isJson && (
                <div>
                  <a href={url} target="_blank" rel="noreferrer" className="text-primary underline">Open itinerary</a>
                </div>
              )}
            </div>
              ) : (
            <div className="text-sm text-muted-foreground">{t('no_itinerary_uploaded')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
