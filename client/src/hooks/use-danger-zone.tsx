import { useEffect, useRef } from 'react';

// simple haversine distance in meters
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Zone {
  id: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  radius: string; // meters
  type: string;
}

// hook watches the user's location and when entering a high-risk zone it plays a 5s alarm
export function useDangerZoneAlert(safetyZones: Zone[] | undefined, enabled = true) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmRef = useRef<{ osc?: OscillatorNode; gain?: GainNode; stopAt?: number } | null>(null);
  const insideRef = useRef<Record<string, boolean>>({});
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!safetyZones || safetyZones.length === 0) return;
    if (!('geolocation' in navigator)) return;

    function startAlarm() {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtxRef.current!;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880; // A5
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        // ramp up quickly
        gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.2);
        // schedule stop in 5s
        const stopAt = ctx.currentTime + 5;
        setTimeout(() => {
          try {
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            osc.stop(ctx.currentTime + 0.3);
          } catch (e) {}
        }, 5000);
        alarmRef.current = { osc, gain, stopAt };
      } catch (e) {
        // webaudio may be blocked by autoplay policies; ignore
      }
    }

    function stopAlarm() {
      try {
        const ctx = audioCtxRef.current;
        if (!ctx || !alarmRef.current) return;
        const { osc, gain } = alarmRef.current;
        if (gain) try { gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2); } catch (e) {}
        if (osc) try { osc.stop(ctx.currentTime + 0.3); } catch (e) {}
        alarmRef.current = null;
      } catch (e) {}
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        for (const z of safetyZones) {
          if (!z || !z.centerLatitude) continue;
          const zLat = parseFloat(z.centerLatitude);
          const zLng = parseFloat(z.centerLongitude);
          const radius = Number(z.radius) || 0;
          const d = haversineDistance(lat, lng, zLat, zLng);
          const inside = d <= radius;
          const previously = !!insideRef.current[z.id];
          if (inside && !previously && z.type === 'high-risk') {
            // entered high-risk zone
            insideRef.current[z.id] = true;
            startAlarm();
            try { window.dispatchEvent(new CustomEvent('danger-zone-entered', { detail: { zone: z } } as any)); } catch (e) {}
          } else if (!inside && previously) {
            insideRef.current[z.id] = false;
            stopAlarm();
            try { window.dispatchEvent(new CustomEvent('danger-zone-exited', { detail: { zone: z } } as any)); } catch (e) {}
          }
        }
      },
      (err) => {
        // ignore
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    );
    watchIdRef.current = id as unknown as number;

    return () => {
      try {
        if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current as any);
      } catch (e) {}
      stopAlarm();
    };
  }, [safetyZones, enabled]);
}
