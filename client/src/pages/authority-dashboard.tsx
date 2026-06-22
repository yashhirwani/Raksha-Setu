import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, AlertTriangle, Ambulance, Shield, Radio, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useI18n } from "@/i18n";

export default function AuthorityDashboard() {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const { data: incidents } = useQuery<any[]>({
    queryKey: ["/api/incidents"],
  });

  const { data: safetyZones } = useQuery<any[]>({
    queryKey: ["/api/safety-zones"],
  });

  // Mock statistics - in a real app these would come from the API
  const stats = {
    activeTourists: 247,
    safeZones: safetyZones?.length || 0,
    activeAlerts: incidents?.filter((i: any) => i.status === 'open').length || 0,
  };

  const recentIncidents = incidents?.slice(0, 2) || [];

  const handleEmergencyResponse = (type: string) => {
    alert(`${type} response has been dispatched!`);
  };

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
          <h1 className="text-lg font-semibold text-foreground">{t('authority_dashboard')}</h1>
          <Button variant="ghost" size="sm">
            <Bell size={20} className="text-foreground" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-foreground" data-testid="stat-active-tourists">
                {stats.activeTourists}
              </div>
              <div className="text-xs text-muted-foreground">{t('active_tourists')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-secondary" data-testid="stat-safe-zones">
                {stats.safeZones}
              </div>
              <div className="text-xs text-muted-foreground">{t('safe_zones_label')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-accent" data-testid="stat-active-alerts">
                {stats.activeAlerts}
              </div>
              <div className="text-xs text-muted-foreground">{t('active_alerts')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Incidents */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t('recent_incidents')}</h3>
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentIncidents.map((incident: any) => (
                <div key={incident.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground" data-testid={`incident-type-${incident.id}`}>
                      {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Emergency
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`incident-location-${incident.id}`}>
                      {incident.location} {incident.touristId && `• Tourist ID: ST-${incident.touristId.slice(-6).toUpperCase()}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(incident.reportedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    incident.priority === 'high' 
                      ? 'bg-destructive/10 text-destructive'
                      : incident.priority === 'medium'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-secondary/10 text-secondary'
                  }`}>
                    {incident.priority.toUpperCase()}
                  </span>
                </div>
              ))}
              
              {recentIncidents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle size={48} className="mx-auto mb-2 opacity-20" />
                  <p>{t('no_recent_incidents')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Actions */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-4">{t('quick_response')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex flex-col items-center p-3 h-auto bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                onClick={() => handleEmergencyResponse('Emergency')}
                data-testid="button-emergency-response"
              >
                <Ambulance size={20} className="mb-1" />
                <span className="text-xs">{t('emergency')}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-3 h-auto bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                onClick={() => handleEmergencyResponse('Security')}
                data-testid="button-security-response"
              >
                    <img src="/raksha-logo.png" alt="logo" className="object-contain w-full h-full mb-1" />
                <span className="text-xs">{t('security')}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-3 h-auto bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                onClick={() => handleEmergencyResponse('Alert')}
                data-testid="button-send-alert"
              >
                <Radio size={20} className="mb-1" />
                <span className="text-xs">{t('send_alert')}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center p-3 h-auto bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                onClick={() => handleEmergencyResponse('Redirect')}
                data-testid="button-redirect"
              >
                <Route size={20} className="mb-1" />
                <span className="text-xs">{t('redirect')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
