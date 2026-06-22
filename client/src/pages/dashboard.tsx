import { useQuery } from "@tanstack/react-query";
import { MapPin, AlertTriangle, Brain, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useI18n } from "@/i18n";
import { useSafetyScore } from '@/hooks/use-safety-score';
import ThemeToggle from '@/components/theme-toggle';

interface DashboardProps {
  touristId: string;
}

export default function Dashboard({ touristId }: DashboardProps) {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const { data: tourist } = useQuery<any>({
    queryKey: ["/api/tourists", touristId],
    enabled: !!touristId,
  });

  const { data: alerts } = useQuery<any[]>({
    queryKey: ["/api/safety-alerts"],
  });
  const { data: activeTrips } = useQuery<any[]>({
    queryKey: ["/api/trips/active"],
  });
  const { data: safetyZones } = useQuery<any[]>({
    queryKey: ["/api/safety-zones"],
  });
  const { data: safetyScore } = useSafetyScore(touristId);

  if (!tourist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading_dashboard')}</p>
        </div>
      </div>
    );
  }

  const initials = tourist.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const scoreVal = safetyScore?.score ?? 0;
  const scoreLevel = safetyScore?.level;
  const ringColor = scoreLevel === 'high' ? '#dc2626' : scoreLevel === 'moderate' ? '#f59e0b' : '#059669';
  const ringBg = 'var(--background, #fff)';

  return (
    <div className="min-h-screen pb-24">
      {/* Combined Hero Section */}
      <div className="relative">
        {/* Theme toggle (dashboard) */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="bg-white dark:bg-neutral-900 text-foreground px-6 pt-6 pb-10 rounded-b-3xl shadow border-b border-border">
          <div className="flex items-start justify-between gap-6 flex-col sm:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-rose-500 text-white shadow flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">{t('welcome_back')}</p>
                  <h1 className="text-2xl font-bold leading-tight" data-testid="user-name">{tourist.name}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/40" data-testid="safety-status">{t('safe_zone_message')}</span>
                <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200/60 dark:border-sky-700/40 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />{t('online')}
                </span>
                <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hidden sm:inline">{t('quick_reporting')}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => navigate('/create-itinerary')} variant="default" className="bg-gradient-to-r from-indigo-600 via-sky-500 to-rose-500 text-white hover:opacity-95 shadow" data-testid="button-start-trip">{t('start_trip')}</Button>
                <Button onClick={() => navigate('/report')} variant="outline" className="border-border text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800" data-testid="button-report-inline">{t('send_alert')}</Button>
              </div>
            </div>
            {/* Safety Score Ring */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-28" aria-label={t('safety_score')}>
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${ringColor} ${scoreVal}%, rgba(255,255,255,0.15) 0)`
                  }}
                />
                <div className="absolute inset-[6px] rounded-full bg-white dark:bg-neutral-800 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-lg font-bold" data-testid="safety-score-value">{safetyScore ? scoreVal : '—'}</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-80">{t('safety_score')}</span>
                  {safetyScore && <span className="text-[10px] mt-0.5 capitalize" data-testid="safety-score-level">{t('risk_level_' + safetyScore.level)}</span>}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t('updated')} {safetyScore && new Date(safetyScore.updatedAt).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid now inside hero */}
        <div className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
              <CardContent className="py-5 px-3 flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('active_trips') ?? 'Active Trips'}</p>
                <p className="text-2xl font-semibold leading-tight">{activeTrips?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow border">
              <CardContent className="py-5 px-3 flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('active_alerts')}</p>
                <p className="text-2xl font-semibold leading-tight">{alerts?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow border">
              <CardContent className="py-5 px-3 flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('safe_zones')}</p>
                <p className="text-2xl font-semibold leading-tight">{safetyZones?.length ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10">
              <CardContent className="py-5 px-3 flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity size={12}/> {t('safety_score')}</p>
                <p className="text-2xl font-semibold leading-tight" data-testid="safety-score-mini">{safetyScore ? scoreVal : '—'}</p>
                {safetyScore && <p className="text-[10px] mt-0.5 capitalize" data-testid="safety-score-level-mini">{t('risk_level_' + safetyScore.level)}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      

      {/* Quick Actions */}
      <div className="px-4 mb-6">
  <h2 className="text-lg font-semibold text-foreground mb-4">{t('quick_actions')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex-col"
            onClick={() => navigate("/map")}
            data-testid="button-safety-map"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-2">
              <MapPin size={20} />
            </div>
            <p className="font-medium text-card-foreground">{t('safety_map')}</p>
                    <p className="text-xs text-muted-foreground">{t('view_nearby_zones')}</p>
          </Button>
          
          <Button
            variant="outline"
            className="h-auto p-4 flex-col"
            onClick={() => navigate("/report")}
            data-testid="button-report-incident"
          >
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mx-auto mb-2">
              <AlertTriangle size={20} />
            </div>
            <p className="font-medium text-card-foreground">{t('send_alert')}</p>
            <p className="text-xs text-muted-foreground">Quick reporting</p>
          </Button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="px-4 mb-6">
  <h2 className="text-lg font-semibold text-foreground mb-4">{t('safety_alerts')}</h2>
        
        {alerts?.map((alert: any) => (
          <Card key={alert.id} className="mb-3">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent/10 text-accent rounded-full flex items-center justify-center mt-1">
                  <AlertTriangle size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground text-sm" data-testid={`alert-title-${alert.id}`}>
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`alert-message-${alert.id}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations: show when enabled */}
      {localStorage.getItem('aiRecommendationsEnabled') === 'true' && (
        <div className="px-4">
  <h2 className="text-lg font-semibold text-foreground mb-4">{t('ai_recommendations')}</h2>
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mt-1">
                  <Brain size={16} />
                </div>
                <div>
                          <p className="font-medium text-card-foreground text-sm mb-2">{t('smart_recommendation_title')}</p>
                          <p className="text-sm text-muted-foreground" data-testid="ai-recommendation">{t('smart_recommendation_body')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Safety Score Details */}
      {safetyScore && (
        <div className="px-4 mt-8 mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('safety_score_details')}</h2>
          <Card className="border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" />
                  <span className="font-medium">{t('overall_score')}</span>
                </div>
                <span className="font-semibold">{safetyScore.score} / 100</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('factor_high_risk_visits')}</p>
                  <p className="font-medium" data-testid="factor-high-risk">{safetyScore.factors.highRiskZoneVisits}</p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('factor_open_incidents')}</p>
                  <p className="font-medium" data-testid="factor-open-incidents">{safetyScore.factors.openIncidents}</p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('factor_active_alerts')}</p>
                  <p className="font-medium" data-testid="factor-active-alerts">{safetyScore.factors.activeAlerts}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('recommendations')}</p>
                <ul className="list-disc pl-5 space-y-1 text-sm" data-testid="safety-score-recommendations">
                  {safetyScore.recommendations.map((r, i) => (<li key={i}>{r}</li>))}
                </ul>
              </div>
              <p className="text-[10px] text-muted-foreground text-right">{t('updated')} {new Date(safetyScore.updatedAt).toLocaleTimeString()}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
