import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import SafetyMap from "@/components/safety-map";

interface MapProps {
  touristId: string;
}

export default function Map({ touristId }: MapProps) {
  const [, navigate] = useLocation();

  const { data: safetyZones } = useQuery({
    queryKey: ["/api/safety-zones"],
  });

  const { data: incidents } = useQuery({
    queryKey: ["/api/incidents"],
  });

  const handleEmergencyCall = () => {
    // In a real app, this would trigger emergency protocols
    alert("Emergency services have been notified. Help is on the way!");
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
          <h1 className="text-lg font-semibold text-foreground">Safety Map</h1>
          <Button variant="ghost" size="sm">
            <Layers size={20} />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-96">
        <SafetyMap 
          safetyZones={safetyZones || []}
          incidents={incidents || []}
          touristId={touristId}
        />
        
        {/* Location Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="bg-card/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground" data-testid="current-location">Current Location</p>
                  <p className="text-sm text-muted-foreground">Downtown Tourist District</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-secondary">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium" data-testid="safety-status">Safe</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map Legend */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-3">Map Legend</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-secondary rounded-full"></div>
            <span className="text-sm text-foreground">Safe Zones</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-destructive rounded-full"></div>
            <span className="text-sm text-foreground">Incident Locations</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-primary-foreground"></div>
            <span className="text-sm text-foreground">Your Location</span>
          </div>
        </div>
      </div>
      
      {/* Emergency Button */}
      <Button
        className="floating-button w-16 h-16 bg-destructive text-destructive-foreground rounded-full"
        onClick={handleEmergencyCall}
        data-testid="button-emergency"
      >
        <Phone size={24} />
      </Button>
    </div>
  );
}
