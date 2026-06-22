import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useI18n } from "@/i18n";
import { toast as toastHelper } from '@/hooks/use-toast';

interface ProfileProps {
  touristId: string;
}

export default function Profile({ touristId }: ProfileProps) {
  const [, navigate] = useLocation();
  const { t } = useI18n();

  const { data: tourist } = useQuery<any>({
    queryKey: ["/api/tourists", touristId],
    enabled: !!touristId,
  });

  const { data: emergencyContacts } = useQuery<any[]>({
    queryKey: ["/api/tourists", touristId, "emergency-contacts"],
    enabled: !!touristId,
  });

  const queryClient = useQueryClient();

  if (!tourist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('loading_profile')}</p>
        </div>
      </div>
    );
  }

  const initials = tourist.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

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
          <h1 className="text-lg font-semibold text-foreground">{t('profile')}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Edit size={20} className="text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // clear current session and redirect to login
                localStorage.removeItem('currentTouristId');
                // don't remove saved credentials — keep them for demo convenience
                navigate('/login');
                // show a small toast
                try {
                  toastHelper({ title: t('success'), description: t('account_created_go_login') });
                } catch (e) {}
              }}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-6 text-primary-foreground">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-foreground text-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold" data-testid="profile-initials">{initials}</span>
          </div>
          <h2 className="text-xl font-semibold" data-testid="profile-name">{tourist.name}</h2>
          <p className="text-primary-foreground/80 text-sm">Digital ID: ST-{tourist.id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">{t('personal_information')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('full_name')}</span>
                <span className="text-sm text-foreground" data-testid="profile-full-name">{tourist.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('nationality')}</span>
                <span className="text-sm text-foreground" data-testid="profile-nationality">{tourist.nationality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('id_number')}</span>
                <span className="text-sm text-foreground" data-testid="profile-id-number">{tourist.idNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">{t('emergency_contacts')}</h3>
            <div className="space-y-3">
              {/* Primary emergency contact from tourist registration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('primary_contact')}</p>
                    <p className="text-xs text-muted-foreground" data-testid="emergency-contact-phone">
                      {tourist.emergencyContact}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">{t('primary')}</span>
              </div>
              
              {/* Additional emergency contacts */}
              {emergencyContacts?.map((contact: any) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`contact-name-${contact.id}`}>
                        {contact.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`contact-phone-${contact.id}`}>
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contact.isPrimary ? (
                      <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">{t('primary')}</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/emergency-contacts/${contact.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isPrimary: true }),
                            });
                            if (!res.ok) throw new Error('Failed to update contact');
                            // refetch contacts
                            try { queryClient.invalidateQueries({ queryKey: ["/api/tourists", touristId, "emergency-contacts"] }); } catch (e) {}
                            toastHelper({ title: t('success'), description: t('primary_contact_set') });
                          } catch (err: any) {
                            toastHelper({ title: t('error'), description: err.message || t('something_went_wrong') });
                          }
                        }}
                      >
                        {t('make_primary')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                className="w-full border-2 border-dashed border-border text-muted-foreground hover:border-muted-foreground"
                data-testid="button-add-emergency-contact"
                onClick={() => navigate('/add-emergency-contact')}
              >
                <Plus size={16} className="mr-2" />
                {t('add_emergency_contact')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">{t('safety_preferences')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t('location_sharing')}</span>
                <Switch defaultChecked data-testid="switch-location-sharing" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t('emergency_alerts')}</span>
                <Switch defaultChecked data-testid="switch-emergency-alerts" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">{t('ai_recommendations_label')}</span>
                <Switch
                  data-testid="switch-ai-recommendations"
                  defaultChecked={localStorage.getItem('aiRecommendationsEnabled') === 'true'}
                  onCheckedChange={(v) => {
                    try {
                      localStorage.setItem('aiRecommendationsEnabled', v ? 'true' : 'false');
                      toastHelper({ title: t('success'), description: v ? t('auto_translate') : t('cancel') });
                    } catch (e) {}
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
