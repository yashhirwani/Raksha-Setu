import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Layers, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import SafetyMap from "@/components/safety-map";
import { useI18n } from "@/i18n";

interface MapProps {
  touristId: string;
}

export default function Map({ touristId }: MapProps) {
  const [, navigate] = useLocation();

  const { data: safetyZones } = useQuery<any[]>({
    queryKey: ["/api/safety-zones"],
    queryFn: async () => (await fetch('/api/safety-zones')).json(),
  });

  const { data: incidents } = useQuery<any[]>({
    queryKey: ["/api/incidents"],
    queryFn: async () => (await fetch('/api/incidents')).json(),
  });

  const [shareLocation, setShareLocation] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [tripFileName, setTripFileName] = useState<string | null>(null);
  const [itineraryUrl, setItineraryUrl] = useState<string | null>(null);
  // create itinerary moved to a separate page
  const { data: tripsList, refetch: refetchTrips } = useQuery<any[]>({
    queryKey: ['/api/trips'],
    queryFn: async () => (await fetch('/api/trips')).json(),
    enabled: true,
  });

  const handleEmergencyCall = () => {
    // Send a safety alert to the server
    fetch('/api/safety-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Panic', message: 'User triggered panic button', type: 'emergency', area: 'unknown' })
    }).catch(() => {});

    // Provide immediate feedback in the UI
    alert(t('authorities_notified'));
  };

  const handleTripUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTripFileName(file.name);

    // In a real app we'd upload the file to server and notify authorities
    const fd = new FormData();
    fd.append('touristId', touristId);
    fd.append('itinerary', file);
    // upload the file and create a trip record
    fetch('/api/trip-itineraries', { method: 'POST', body: fd }).then(r => r.json()).then(t => {
      setActiveTripId(t.id);
      setItineraryUrl(t.itineraryUrl ?? null);
      // Start tracking automatically when trip is uploaded
      setIsTracking(true);
      fetch('/api/trips/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: t.id }) }).catch(() => {});
    }).catch(() => {});
  };

  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const startTrip = async () => {
    // If there's no activeTripId but the user uploaded a file name, create a trip record first
    if (!activeTripId && tripFileName) {
      try {
        const res = await fetch('/api/trip-itineraries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ touristId, itineraryName: tripFileName }) });
        const t = await res.json();
        setActiveTripId(t.id);
        // start it
        await fetch('/api/trips/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: t.id }) });
        setIsTracking(true);
        return;
      } catch (e) {
        return;
      }
    }

    if (!activeTripId) return;
    await fetch('/api/trips/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: activeTripId }) });
    setIsTracking(true);
    // announce for screen readers
    const live = document.getElementById('trip-live-region');
    if (live) live.textContent = 'Trip started';
  };

  const endTrip = async () => {
    if (!activeTripId) return;
    await fetch('/api/trips/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tripId: activeTripId }) });
    setIsTracking(false);
    setActiveTripId(null);
    setTripFileName(null);
    const live = document.getElementById('trip-live-region');
    if (live) live.textContent = 'Trip ended';
  };

  const { t } = useI18n();

  const bannerRef = useRef<HTMLDivElement | null>(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    function update() {
      const h = bannerRef.current?.offsetHeight ?? 0;
      setBannerHeight(h);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeTripId]);

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">{t('safety_map')}</h1>
          <Button variant="ghost" size="sm">
            <Layers size={20} />
          </Button>
        </div>
      </div>

      {/* Active Trip Banner - non-overlapping, sits above the map and pushes controls down */}
      {activeTripId && (
        <>
          <div ref={bannerRef} className="px-4 mb-3 z-30 relative">
            <Card className="bg-emerald-600 text-white">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-medium">{t('trip_active')}</div>
                  <div className="text-xs opacity-90">{t('trip_id')}: {activeTripId}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="button" size="sm" className="bg-red-600 text-white" onClick={endTrip}>{t('end_trip')}</Button>
                  {itineraryUrl && (
                    // make the view/download link always visible and trigger download
                    <a href={itineraryUrl} download className="px-3 py-1 rounded border border-white/40 bg-white/10 text-white text-sm no-underline" target="_blank" rel="noreferrer">{t('view_itinerary')}</a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoped style: set a CSS variable on the map wrapper (below) so Leaflet's top controls
              are offset by the banner height dynamically. This avoids a global hard-coded value.
          */}
        </>
      )}

      {/* Map Container */}
      <div className="relative map-wrapper" style={{ ['--banner-offset' as any]: `${bannerHeight}px` }}>
        {/* Scoped CSS: use the computed --banner-offset to push top leaflet controls down */}
        <style>{`
          .map-wrapper .leaflet-top.leaflet-left,
          .map-wrapper .leaflet-top.leaflet-right {
            top: calc(var(--banner-offset, 0px) + 8px) !important;
          }
          /* ensure control container sits above map overlays but below UI banners */
          .map-wrapper .leaflet-control-container { z-index: 450; }
        `}</style>
        <div className="h-[62vh]">
          <SafetyMap
            safetyZones={safetyZones || []}
            incidents={incidents || []}
            touristId={touristId}
            shareLocation={shareLocation}
            isTracking={isTracking}
          />
        </div>
        
        {/* Location Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground" data-testid="current-location">{t('current_location')}</p>
                  <p className="text-sm text-muted-foreground">{t('safety_zone_example')}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-secondary">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium" data-testid="safety-status">{t('safe')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map Legend */}
      <div className="p-4">
          <h3 className="font-semibold text-foreground mb-3">{t('map_legend')}</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-secondary rounded-full"></div>
            <span className="text-sm text-foreground">{t('safe_zones')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-destructive rounded-full"></div>
            <span className="text-sm text-foreground">{t('incident_locations')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-primary-foreground"></div>
            <span className="text-sm text-foreground">{t('your_location')}</span>
          </div>
        </div>
      </div>
      
      {/* Trip Controls (placed under legend for better layout) */}
      <div className="p-4">
        <Card className="bg-card/95">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <input id="trip-upload" type="file" accept=".pdf,.docx,.json" onChange={handleTripUpload} className="hidden" />
                  <label htmlFor="trip-upload" className="btn btn-sm bg-muted text-foreground px-4 py-2 rounded-md cursor-pointer" style={{minWidth:0}}>
                    {t('upload_trip')}
                  </label>

                  <button type="button" className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={() => navigate('/create-itinerary')}>{t('create_itinerary')}</button>

                  <div className="flex items-center space-x-2 bg-muted p-2 rounded-md" style={{minWidth:0}}>
                    <label className="text-sm">{t('share_location')}</label>
                    <input aria-label="share-location" type="checkbox" checked={shareLocation} onChange={() => setShareLocation(s => !s)} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2 bg-muted p-2 rounded-md">
                      <label className="text-sm mr-2">{t('live_track')}</label>
                      <button aria-label={isTracking ? t('stop') : t('start')} type="button" className="px-3 py-1 rounded bg-primary text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary" onClick={() => setIsTracking(t => !t)}>{isTracking ? t('stop') : t('start')}</button>
                    </div>

                  {!activeTripId ? (
                    <button aria-label="Start trip" tabIndex={0} type="button" className="px-4 py-2 rounded bg-emerald-600 text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600" onClick={startTrip} disabled={!tripFileName}>{t('start_trip')}</button>
                  ) : (
                    <button aria-label="End trip" tabIndex={0} type="button" className="px-4 py-2 rounded bg-red-600 text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600" onClick={endTrip}>{t('end_trip')}</button>
                  )}
                </div>
              </div>

              {/* create itinerary moved to /create-itinerary page */}

              {tripFileName && (
                <div className="text-sm text-muted-foreground">{t('selected_itinerary')} <span className="font-medium">{tripFileName}</span> {itineraryUrl && (<a href={itineraryUrl} target="_blank" rel="noreferrer" className="ml-2 text-primary underline">{t('view_itinerary')}</a>)}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing trips list */}
      <div className="p-4">
  <h3 className="font-semibold text-foreground mb-3">{t('your_trips')}</h3>
        <div className="space-y-2">
          {(tripsList || []).map((trip) => (
            <Card key={trip.id} className="bg-card/90">
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-medium">{trip.itineraryName ?? t('unnamed_trip')}</div>
                  <div className="text-xs text-muted-foreground">ID: {trip.id}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {trip.itineraryUrl && (<a href={`/trips/${trip.id}`} className="text-sm text-primary underline">{t('view_itinerary')}</a>)}
                  <button type="button" className="px-3 py-1 rounded bg-primary text-primary-foreground" onClick={() => { setActiveTripId(trip.id); setItineraryUrl(trip.itineraryUrl ?? null); setTripFileName(trip.itineraryName ?? null); setIsTracking(trip.isActive ?? false); }}>Select</button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* ARIA live region for announcements */}
      <div id="trip-live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>

      {/* Floating Panic Button removed on map page to avoid overlap with map controls */}
    </div>
  );
}
