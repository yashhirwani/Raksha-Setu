import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "emergency";
}

export default function NotificationToast() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show demo notification after 3 seconds
    const timer = setTimeout(() => {
      showNotification({
        id: "demo-alert",
        title: "Safety Alert",
        message: "High traffic reported in your area. Consider using alternate routes.",
        type: "warning"
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const showNotification = (notif: Notification) => {
    setNotification(notif);
    setIsVisible(true);
    
    // Auto hide after 4 seconds
    setTimeout(() => {
      hideNotification();
    }, 4000);
  };

  const hideNotification = () => {
    setIsVisible(false);
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  if (!notification) return null;

  return (
    <div
      className={`fixed top-16 left-4 right-4 bg-card border border-border rounded-xl p-4 shadow-lg z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
      data-testid="notification-toast"
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center">
          <Bell size={16} />
        </div>
        <div className="flex-1">
          <p className="font-medium text-card-foreground text-sm" data-testid="notification-title">
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="notification-message">
            {notification.message}
          </p>
        </div>
        <button 
          onClick={hideNotification} 
          className="text-muted-foreground"
          data-testid="button-close-notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
