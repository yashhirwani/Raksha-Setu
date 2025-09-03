import { useQuery } from "@tanstack/react-query";
import { User, Shield, MapPin, AlertTriangle, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface DashboardProps {
  touristId: string;
}

export default function Dashboard({ touristId }: DashboardProps) {
  const [, navigate] = useLocation();

  const { data: tourist } = useQuery({
    queryKey: ["/api/tourists", touristId],
    enabled: !!touristId,
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/safety-alerts"],
  });

  if (!tourist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
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
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <span className="font-medium text-sm" data-testid="user-initials">{initials}</span>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Welcome back</p>
              <p className="text-sm text-muted-foreground" data-testid="user-name">{tourist.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Safety Status */}
      <div className="p-4">
        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center">
                <Shield size={16} />
              </div>
              <div>
                <p className="font-medium text-secondary" data-testid="safety-status">You're in a Safe Zone</p>
                <p className="text-sm text-muted-foreground">Downtown Tourist District - Low Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
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
            <p className="font-medium text-card-foreground">Safety Map</p>
            <p className="text-xs text-muted-foreground">View nearby zones</p>
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
            <p className="font-medium text-card-foreground">Report Incident</p>
            <p className="text-xs text-muted-foreground">Quick reporting</p>
          </Button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Safety Alerts</h2>
        
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

      {/* AI Recommendations */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">AI Safety Recommendations</h2>
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mt-1">
                <Brain size={16} />
              </div>
              <div>
                <p className="font-medium text-card-foreground text-sm mb-2">Smart Recommendation</p>
                <p className="text-sm text-muted-foreground" data-testid="ai-recommendation">
                  Based on your location and recent incidents, we recommend staying in well-lit areas after 8 PM and using main streets for navigation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
