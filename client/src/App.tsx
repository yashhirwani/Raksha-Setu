import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import NotFound from "@/pages/not-found";
import Registration from "@/pages/registration";
import DigitalId from "@/pages/digital-id";
import Dashboard from "@/pages/dashboard";
import Map from "@/pages/map";
import IncidentReport from "@/pages/incident-report";
import Profile from "@/pages/profile";
import AuthorityDashboard from "@/pages/authority-dashboard";
import BottomNavigation from "@/components/bottom-navigation";
import StatusBar from "@/components/status-bar";
import NotificationToast from "@/components/notification-toast";

function Router() {
  const [currentTourist, setCurrentTourist] = useState<string | null>(
    localStorage.getItem("currentTouristId")
  );

  useEffect(() => {
    if (currentTourist) {
      localStorage.setItem("currentTouristId", currentTourist);
    } else {
      localStorage.removeItem("currentTouristId");
    }
  }, [currentTourist]);

  return (
    <div className="app-container">
      <StatusBar />
      <Switch>
        <Route path="/" component={Registration} />
        <Route 
          path="/digital-id/:touristId" 
          component={({ params }) => (
            <DigitalId 
              touristId={params.touristId} 
              onComplete={() => setCurrentTourist(params.touristId)} 
            />
          )} 
        />
        <Route 
          path="/dashboard" 
          component={() => currentTourist ? <Dashboard touristId={currentTourist} /> : <Registration />} 
        />
        <Route 
          path="/map" 
          component={() => currentTourist ? <Map touristId={currentTourist} /> : <Registration />} 
        />
        <Route 
          path="/report" 
          component={() => currentTourist ? <IncidentReport touristId={currentTourist} /> : <Registration />} 
        />
        <Route 
          path="/profile" 
          component={() => currentTourist ? <Profile touristId={currentTourist} /> : <Registration />} 
        />
        <Route path="/authority" component={AuthorityDashboard} />
        <Route component={NotFound} />
      </Switch>
      {currentTourist && <BottomNavigation />}
      <NotificationToast />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
