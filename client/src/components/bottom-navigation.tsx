import { useLocation } from "wouter";
import { Home, MapPin, Plus, Shield, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, navigate] = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/report", icon: Plus, label: "Report" },
    { path: "/authority", icon: Shield, label: "Alerts" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="bottom-nav" data-testid="bottom-navigation">
      <div className="flex">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <div
              key={item.path}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => navigate(item.path)}
              data-testid={`nav-item-${item.label.toLowerCase()}`}
            >
              <Icon className="text-lg mb-1 block mx-auto" size={20} />
              <span className="text-xs">{item.label}</span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
