import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, UserX, AlertTriangle, Car, VenetianMask, Camera, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useI18n } from "@/i18n";

interface IncidentReportProps {
  touristId: string;
}

interface IncidentForm {
  type: string;
  location: string;
  latitude?: string;
  longitude?: string;
  description: string;
  priority: string;
  isAnonymous: boolean;
}

const incidentTypes = [
  { id: "medical", labelKey: "incident_medical", icon: UserX, color: "destructive" },
  { id: "safety", labelKey: "incident_safety", icon: AlertTriangle, color: "accent" },
  { id: "accident", labelKey: "incident_accident", icon: Car, color: "destructive" },
  { id: "suspicious", labelKey: "incident_suspicious", icon: VenetianMask, color: "muted" },
];

const priorityLevels = [
  { id: "low", labelKey: "priority_low", color: "secondary" },
  { id: "medium", labelKey: "priority_medium", color: "accent" },
  { id: "high", labelKey: "priority_high", color: "destructive" },
];

export default function IncidentReport({ touristId }: IncidentReportProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<IncidentForm>({
    type: "",
    location: "",
    latitude: undefined,
    longitude: undefined,
    description: "",
    priority: "low",
    isAnonymous: false,
  });

  const submitIncidentMutation = useMutation({
    mutationFn: async (data: IncidentForm) => {
      const payload = {
        ...data,
        touristId: data.isAnonymous ? null : touristId,
      };
      const response = await apiRequest("POST", "/api/incidents", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Incident report submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit incident report",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description) {
      toast({
        title: "Error",
        description: "Please select incident type and provide description",
        variant: "destructive",
      });
      return;
    }

    submitIncidentMutation.mutate(formData);
  };

  const handleIncidentTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handlePrioritySelect = (priority: string) => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          // try to reverse-geocode a friendly address (browser-free approach: use a simple geocoding API if available)
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // update immediate coords
            setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lon) }));
            // attempt to call a public reverse-geocoding service (no key) - fallback is just coordinates
            fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`).then(r => r.json()).then((data) => {
              const display = data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
              setFormData(prev => ({ ...prev, location: display }));
              toast({ title: t('success'), description: t('auto_detected_location') });
            }).catch(() => {
              setFormData(prev => ({ ...prev, location: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}` }));
              toast({ title: t('success'), description: t('auto_detected_location') });
            });
          } catch (e) {
            setFormData(prev => ({ ...prev, location: `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}` }));
            toast({ title: t('success'), description: t('auto_detected_location') });
          }
        },
        () => {
          toast({
          title: t('error'),
          description: t('error'),
            variant: "destructive",
          });
        }
      );
    }
  };

  // Auto-detect location when component mounts to pre-fill the form
  useEffect(() => {
    if (navigator && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setFormData(prev => ({ ...prev, latitude: String(lat), longitude: String(lon) }));
        // reverse geocode to user-friendly address in background
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`).then(r => r.json()).then((data) => {
          const display = data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          setFormData(prev => ({ ...prev, location: display }));
        }).catch(() => {
          setFormData(prev => ({ ...prev, location: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }));
        });
      }, () => {} , { enableHighAccuracy: true, timeout: 5000 });
    }
  }, []);

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
          <h1 className="text-lg font-semibold text-foreground">{t('report_incident')}</h1>
          <div></div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-3">{t('incident_type')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {incidentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.id;
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleIncidentTypeSelect(type.id)}
                    className={`border-2 rounded-lg p-3 text-left transition-colors ${
                      isSelected 
                        ? "border-destructive bg-destructive/10" 
                        : "border-border hover:border-destructive"
                    }`}
                    data-testid={`incident-type-${type.id}`}
                  >
                    <Icon className={`mb-2 block ${type.color === 'destructive' ? 'text-destructive' : type.color === 'accent' ? 'text-accent' : 'text-muted-foreground'}`} size={20} />
                    <span className="text-sm font-medium">{t(type.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">{t('location_label')}</Label>
            <div className="flex space-x-2">
                <Input
                id="location"
                type="text"
                placeholder={t('auto_detected_location')}
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="flex-1"
                data-testid="input-location"
              />
              <Button
                type="button"
                variant="outline"
                onClick={detectLocation}
                data-testid="button-detect-location"
              >
                <Crosshair size={16} />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">{t('description_label')}</Label>
            <Textarea
              id="description"
              placeholder={t('description_placeholder')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-24 resize-none"
              data-testid="textarea-description"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">{t('photo_evidence')}</Label>
            <Card className="border-2 border-dashed border-border hover:border-muted-foreground transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Camera className="text-2xl text-muted-foreground mb-2 mx-auto" size={32} />
                <p className="text-sm text-muted-foreground">{t('photo_evidence')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Priority Level */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-3">{t('priority_level')}</Label>
            <div className="flex space-x-2">
              {priorityLevels.map((level) => {
                const isSelected = formData.priority === level.id;
                
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handlePrioritySelect(level.id)}
                    className={`flex-1 p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? level.color === 'secondary' 
                          ? 'border-secondary bg-secondary/10 text-secondary'
                          : level.color === 'accent'
                          ? 'border-accent bg-accent/10 text-accent' 
                          : 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border text-muted-foreground hover:border-accent'
                    }`}
                    data-testid={`priority-${level.id}`}
                  >
                    {t(level.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3">
            <Checkbox
              id="anonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: !!checked }))}
              data-testid="checkbox-anonymous"
            />
                <Label htmlFor="anonymous" className="text-sm text-foreground">{t('submit_anonymously')}</Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitIncidentMutation.isPending}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-submit-report"
          >
            {submitIncidentMutation.isPending ? t('submit_report') : t('submit_report')}
          </Button>
        </form>
      </div>
    </div>
  );
}
