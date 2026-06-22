import { useEffect, useRef, useState, useMemo } from "react";
import { useI18n } from "@/i18n";
import { useDangerZoneAlert } from '@/hooks/use-danger-zone';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from "react-leaflet";
import L from "leaflet";
// @ts-ignore: leaflet.heat has no types bundled
import 'leaflet.heat';

interface SafetyZone {
  id: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  radius: string;
  type: string;
}

interface Incident {
  id: string;
  latitude?: string;
  longitude?: string;
  type: string;
}

interface SafetyMapProps {
  safetyZones: SafetyZone[];
  incidents: Incident[];
  touristId: string;
  shareLocation?: boolean;
  isTracking?: boolean;
}

// Fix Leaflet's default icon paths when using bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  // Use import.meta.url so the bundler (Vite) can resolve asset URLs in ESM
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function SafetyMap({ safetyZones, incidents, touristId, shareLocation = false, isTracking = false }: SafetyMapProps) {
  const watchIdRef = useRef<number | null>(null);
  const { t } = useI18n();
  const { toast } = useToast();
  const lastKnownRef = useRef<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: 20.5937, lng: 78.9629 }); // default to India
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatRadius, setHeatRadius] = useState(25);
  const [timeRangeHours, setTimeRangeHours] = useState(24);
  const [showClusters, setShowClusters] = useState(true);

  const postLocation = async (lat: number, lng: number) => {
    if (!shareLocation) return;
    try {
      await fetch('/api/location-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ touristId, latitude: lat, longitude: lng, inSafeZone: false }),
      });
    } catch (e) {}
  };

  const startWatch = () => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        lastKnownRef.current = { lat, lng };
        postLocation(lat, lng);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current = id as unknown as number;
  };

  const stopWatch = () => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current as any);
      watchIdRef.current = null;
    }
  };

  useEffect(() => {
    if (isTracking) startWatch();
    else stopWatch();
    return () => stopWatch();
  }, [isTracking]);

  // enable danger-zone audio alerts when tracking or sharing location
  useDangerZoneAlert(safetyZones as any, isTracking || shareLocation);

  useEffect(() => {
    function onEnter(e: any) {
      const zone = e?.detail?.zone;
      toast?.({ title: `Entered danger zone: ${zone?.name ?? ''}`, description: t('danger_zone_alert_description') || 'You entered a high-risk area', duration: 5000 });
    }
    window.addEventListener('danger-zone-entered', onEnter as EventListener);
    return () => window.removeEventListener('danger-zone-entered', onEnter as EventListener);
  }, [toast, t]);

  useEffect(() => {
    let canceled = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (canceled) return;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          lastKnownRef.current = { lat, lng };
        },
        () => {
          const stored = localStorage.getItem('lastKnownLocation');
          if (stored) {
            try {
              const p = JSON.parse(stored);
              setUserLocation({ lat: p.lat, lng: p.lng });
            } catch {}
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
    return () => { canceled = true; };
  }, []);

  useEffect(() => {
    if (lastKnownRef.current) {
      localStorage.setItem('lastKnownLocation', JSON.stringify(lastKnownRef.current));
    }
  }, [userLocation]);

  const [heatPoints, setHeatPoints] = useState<Array<[number, number, number]>>([]);
  useEffect(() => {
    let mounted = true;
    fetch(`/api/incident-heatmap?hours=${timeRangeHours}`)
      .then(res => res.json())
      .then((data: Array<[number, number, number]>) => {
        if (!mounted) return;
        setHeatPoints(data);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [timeRangeHours]);

  // fall detection
  useEffect(() => {
    let lastAcc = 0;
    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      if (magnitude - lastAcc > 15) {
        fetch('/api/safety-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Fall detected', message: 'Possible fall detected from device sensors', type: 'emergency', area: 'unknown' }) }).catch(() => {});
      }
      lastAcc = magnitude;
    }
    window.addEventListener('devicemotion', handleMotion as any);
    return () => window.removeEventListener('devicemotion', handleMotion as any);
  }, []);

  return (
    <div className="w-full h-full">
      <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter lat={userLocation.lat} lng={userLocation.lng} />

        {/* Safety zones as circles */}
        {safetyZones.map((z) => (
          <Circle
            key={z.id}
            center={[parseFloat(z.centerLatitude), parseFloat(z.centerLongitude)]}
            radius={Number(z.radius)}
            pathOptions={{ color: z.type === 'safe' ? 'green' : z.type === 'high-risk' ? 'red' : 'orange', fillOpacity: 0.2 }}
          />
        ))}

        {/* Incidents as markers */}
        {incidents.map((inc) => (
          inc.latitude && inc.longitude ? (
            <Marker key={inc.id} position={[parseFloat(inc.latitude), parseFloat(inc.longitude)]} />
          ) : null
        ))}

        {/* Heatmap layer — added via leaflet.heat plugin */}
        {showHeatmap && heatPoints.length > 0 && (
          <HeatmapLayer points={heatPoints} radius={heatRadius} />
        )}

        {/* User marker */}
        <Marker position={[userLocation.lat, userLocation.lng]} />
      </MapContainer>
      <div className="absolute left-4 bottom-4 bg-card/90 backdrop-blur-sm p-3 rounded-md w-64 shadow-md">
        <div className="text-sm font-medium">{t('location_label')}</div>
        <div className="text-xs text-muted-foreground">{permissionDenied ? t('permission_denied_last_known') : t('live_status')}</div>
        <div className="mt-2 text-xs">Lat: {userLocation.lat.toFixed(5)} Lon: {userLocation.lng.toFixed(5)}</div>
      </div>
      {/* Map Controls */}
      <div className="absolute right-4 top-4 bg-card/95 p-3 rounded-md shadow-md w-56">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">{t('map_controls')}</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <label>{t('show_heatmap')}</label>
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
          </div>
          <div className="flex items-center justify-between">
            <label>{t('heatmap_radius')}</label>
            <input aria-label="heatmap-radius" type="range" min={10} max={60} value={heatRadius} onChange={(e) => setHeatRadius(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <label>{t('time_range')}</label>
            <select value={timeRangeHours} onChange={(e) => setTimeRangeHours(Number(e.target.value))}>
              <option value={6}>6h</option>
              <option value={12}>12h</option>
              <option value={24}>24h</option>
              <option value={72}>72h</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label>{t('show_clusters')}</label>
            <input type="checkbox" checked={showClusters} onChange={(e) => setShowClusters(e.target.checked)} />
          </div>
        </div>
      </div>
      {showClusters && (
        <div className="absolute right-4 bottom-4 bg-card/90 p-3 rounded-md shadow-md w-48">
          <div className="text-sm font-medium">{t('map_legend')}</div>
          <div className="text-xs mt-2">• {t('safe_zones')}</div>
          <div className="text-xs">• {t('incident_locations')}</div>
        </div>
      )}
    </div>
  );
}

function HeatmapLayer({ points, radius = 25 }: { points: Array<[number, number, number]>; radius?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    // @ts-ignore
    const heat = (L as any).heatLayer(points, { radius, blur: 15, maxZoom: 17 });
    heat.addTo(map);
    return () => {
      try { map.removeLayer(heat); } catch {};
    };
  }, [map, points, radius]);
  return null;
}

// Simple clustering by rounding coords to 3 decimals
function Clusters({ incidents }: { incidents: Incident[] }) {
  const clusters = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number; count: number }>();
    for (const inc of incidents) {
      if (!inc.latitude || !inc.longitude) continue;
      const lat = parseFloat(inc.latitude);
      const lng = parseFloat(inc.longitude);
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const existing = m.get(key);
      if (existing) { existing.lat += lat; existing.lng += lng; existing.count += 1; }
      else m.set(key, { lat, lng, count: 1 });
    }
    return Array.from(m.values()).map(v => ({ lat: v.lat / v.count, lng: v.lng / v.count, count: v.count }));
  }, [incidents]);

  return <>
    {clusters.map((c, idx) => (
      <Marker key={idx} position={[c.lat, c.lng]}>
        <Popup>{`${c.count} incident${c.count>1? 's':''}`}</Popup>
      </Marker>
    ))}
  </>;
}
