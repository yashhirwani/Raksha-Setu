import { useState } from "react";
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
  { id: "medical", label: "Medical Emergency", icon: UserX, color: "destructive" },
  { id: "safety", label: "Safety Concern", icon: AlertTriangle, color: "accent" },
  { id: "accident", label: "Accident", icon: Car, color: "destructive" },
  { id: "suspicious", label: "Suspicious Activity", icon: VenetianMask, color: "muted" },
];

const priorityLevels = [
  { id: "low", label: "Low", color: "secondary" },
  { id: "medium", label: "Medium", color: "accent" },
  { id: "high", label: "High", color: "destructive" },
];

export default function IncidentReport({ touristId }: IncidentReportProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<IncidentForm>({
    type: "",
    location: "Times Square, NYC",
    latitude: "40.7589",
    longitude: "-73.9851",
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
          toast({
            title: "Location Updated",
            description: "Your current location has been detected",
          });
        },
        () => {
          toast({
            title: "Location Error",
            description: "Unable to detect location. Using default.",
            variant: "destructive",
          });
        }
      );
    }
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
          <h1 className="text-lg font-semibold text-foreground">Report Incident</h1>
          <div></div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Type */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-3">Incident Type</Label>
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
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">Location</Label>
            <div className="flex space-x-2">
              <Input
                id="location"
                type="text"
                placeholder="Auto-detected location"
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
            <Label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-24 resize-none"
              data-testid="textarea-description"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">Photo Evidence (Optional)</Label>
            <Card className="border-2 border-dashed border-border hover:border-muted-foreground transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Camera className="text-2xl text-muted-foreground mb-2 mx-auto" size={32} />
                <p className="text-sm text-muted-foreground">Tap to add photo</p>
              </CardContent>
            </Card>
          </div>

          {/* Priority Level */}
          <div>
            <Label className="block text-sm font-medium text-foreground mb-3">Priority Level</Label>
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
                    {level.label}
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
            <Label htmlFor="anonymous" className="text-sm text-foreground">Submit anonymously</Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitIncidentMutation.isPending}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-submit-report"
          >
            {submitIncidentMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </div>
    </div>
  );
}
