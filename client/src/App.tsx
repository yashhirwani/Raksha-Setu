import CreateItinerary from '@/pages/create-itinerary';
import Login from '@/pages/login';
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
import AddEmergencyContact from "@/pages/add-emergency-contact";
import AuthorityDashboard from "@/pages/authority-dashboard";
import TripDetail from "@/pages/trip-detail";
import BottomNavigation from "@/components/bottom-navigation";
import StatusBar from "@/components/status-bar";
import NotificationToast from "@/components/notification-toast";
import { I18nProvider } from "./i18n";
import Header from "@/components/header";

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
      <Header />
      <StatusBar />
      <div className="app-content-safe-bottom">
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
          component={() => currentTourist ? <Dashboard touristId={currentTourist} /> : <Login />}
        />
        <Route
          path="/map"
          component={() => currentTourist ? <Map touristId={currentTourist} /> : <Login />}
        />
        <Route
          path="/create-itinerary"
          component={() => currentTourist ? <CreateItinerary /> : <Login />}
        />
        <Route path="/add-emergency-contact" component={() => currentTourist ? <AddEmergencyContact /> : <Login />} />
        <Route
          path="/report"
          component={() => currentTourist ? <IncidentReport touristId={currentTourist} /> : <Login />}
        />
        <Route
          path="/profile"
          component={() => currentTourist ? <Profile touristId={currentTourist} /> : <Login />}
        />
        <Route path="/authority" component={AuthorityDashboard} />
        <Route path="/trips/:id" component={({ params }) => currentTourist ? <TripDetail params={params} /> : <Login />} />
        <Route path="/create-itinerary" component={() => currentTourist ? <CreateItinerary /> : <Login />} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
        </Switch>
      </div>
      {currentTourist && <BottomNavigation />}
      <NotificationToast />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <Toaster />
          <Router />
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
