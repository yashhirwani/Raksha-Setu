import { useLocation } from "wouter";
import { Home, MapPin, Plus, Shield, User } from "lucide-react";
import { useI18n } from "@/i18n";
import { useToast } from "@/hooks/use-toast";
import NotificationToast from "@/components/notification-toast";
import { useState, useEffect, useRef } from 'react';

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { t } = useI18n();

  // Place the alerts (Shield) button in the center as the primary CTA
  const navItems = [
    { path: "/dashboard", icon: Home, label: t('home') },
    { path: "/map", icon: MapPin, label: t('map_short') },
    { path: "/authority", icon: Shield, label: t('panic') }, // center CTA renamed
    { path: "/report", icon: Plus, label: t('report_short') },
    { path: "/profile", icon: User, label: t('profile_short') },
  ];

  const { toast } = useToast();

  // countdown state for emergency confirmation
  const [isCounting, setIsCounting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef<number | null>(null);

  const sendAlert = async () => {
    try {
      // try to get device geolocation
      let latitude: number | undefined = undefined;
      let longitude: number | undefined = undefined;
      if (navigator && 'geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (geoErr) {
          // ignore geolocation errors - continue without coords
        }
      }

  const payload = { title: 'Emergency alert', message: 'User triggered emergency alert', type: 'emergency', area: 'unknown', latitude: typeof latitude === 'number' ? String(latitude) : undefined, longitude: typeof longitude === 'number' ? String(longitude) : undefined } as any;
      const res = await fetch('/api/safety-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const txt = await res.text();
      if (!res.ok) {
        let msg = txt || res.statusText || 'Failed to notify authorities';
        try { const p = JSON.parse(txt); msg = p?.message || msg; } catch (e) {}
        throw new Error(msg);
      }
      try { await JSON.parse(txt); } catch(e) {}
  toast({ title: 'Alert sent', description: `Authorities notified${payload.latitude ? ` at ${payload.latitude}, ${payload.longitude}` : ''}`, duration: 8000 });

      // Try to call emergency contact (primary) if available
      try {
        const touristId = localStorage.getItem('currentTouristId');
        if (touristId) {
          const tRes = await fetch(`/api/tourists/${touristId}`);
          if (tRes.ok) {
            const t = await tRes.json();
            // first prefer explicit emergencyContacts via API
            const ecRes = await fetch(`/api/tourists/${touristId}/emergency-contacts`);
            let phone: string | null = null;
            if (ecRes.ok) {
              const list = await ecRes.json();
              const primary = list.find((c: any) => c.isPrimary) || list[0];
              if (primary) phone = primary.phone;
            }
            // fallback to tourist.emergencyContact field
            if (!phone && t.emergencyContact) phone = t.emergencyContact;

            if (phone) {
              // open tel: link to initiate call on supported devices
              window.location.href = `tel:${phone}`;
            }
          }
        }
      } catch (callErr) {
        // ignore call errors, authorities already notified
      }
    } catch (err: any) {
      toast({ title: 'Alert failed', description: err?.message || 'Could not send alert', duration: 8000 });
    }
  };

  const startCountdown = (secs = 5) => {
    if (isCounting) return; // already counting
    setCountdown(secs);
    setIsCounting(true);
    intervalRef.current = window.setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000) as unknown as number;
  };

  const cancelCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCounting(false);
    setCountdown(5);
    toast({ title: 'Alert cancelled', description: 'You cancelled the emergency alert', duration: 4000 });
  };

  // when countdown hits 0, send alert
  useEffect(() => {
    if (!isCounting) return;
    if (countdown <= 0) {
      // stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsCounting(false);
      setCountdown(5);
      // send the alert
      sendAlert();
    }
  }, [countdown, isCounting]);

  return (
    <>
  {/* Enhanced footer navigation layout */}
  <nav
    className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-neutral-50/95 dark:bg-neutral-800/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-t border-neutral-200 dark:border-neutral-700 shadow-[0_-4px_18px_-4px_rgba(0,0,0,0.2)]"
    data-testid="bottom-navigation"
  >
    <div className="mx-auto w-full max-w-2xl px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)]">
      <div className="relative flex items-end justify-between">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const isCenter = index === 2;
          const onClick = isCenter ? () => startCountdown(5) : () => navigate(item.path);
          return (
            <button
              key={item.path}
              onClick={onClick}
              className={[
                'group relative flex flex-col items-center justify-center rounded-xl font-medium transition-all',
                isCenter ? 'w-14 h-14 -mt-8 bg-red-600 text-white shadow-lg shadow-red-600/40 hover:bg-red-600/90 hover:scale-[1.04] active:scale-95' : 'h-14 flex-1',
                !isCenter && 'px-2',
                !isCenter && (isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'),
              ].join(' ')}
              data-testid={`nav-item-${item.label.toLowerCase()}`}
            >
              {/* Active indicator bar (non-center) */}
              {!isCenter && (
                <span className={`absolute -top-2 h-1 w-6 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}></span>
              )}
              <Icon size={isCenter ? 24 : 20} className={isCenter ? 'drop-shadow-sm' : ''} />
              <span className={`mt-1 text-[11px] leading-none ${isCenter ? 'text-white font-semibold' : 'font-medium'} `}>{item.label}</span>
              {isCenter && isCounting && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-[10px] flex items-center justify-center text-white animate-pulse">
                  {countdown}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  </nav>

      {/* Countdown / confirmation UI */}

      {isCounting && (
        <div className="fixed left-0 right-0 bottom-20 z-[100] flex justify-center pointer-events-none">
          <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-xl flex items-center px-5 py-4 gap-4 max-w-md w-full mx-2 pointer-events-auto animate-fade-in">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {countdown}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base text-foreground mb-0.5">Notifying authorities</div>
              <div className="text-xs text-muted-foreground leading-snug">Sending emergency alert in {countdown}s. Tap cancel to abort.</div>
            </div>
            <button
              onClick={cancelCountdown}
              className="ml-2 px-4 py-2 bg-muted text-foreground rounded-lg font-medium border border-border hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              style={{ minWidth: 64 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <NotificationToast />
    </>
  );
}
