import { Wifi, Signal, Battery } from "lucide-react";

export default function StatusBar() {
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false
  });

  return (
    <div className="status-bar" data-testid="status-bar">
      <div className="flex items-center space-x-1">
        <div className="w-1 h-1 bg-foreground rounded-full"></div>
        <div className="w-1 h-1 bg-foreground rounded-full"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
      </div>
      <div className="text-sm font-medium text-foreground" data-testid="status-time">
        {currentTime}
      </div>
      <div className="flex items-center space-x-1">
        <Signal className="w-3 h-3" />
        <Wifi className="w-3 h-3" />
        <div className="w-6 h-3 border border-foreground rounded-sm">
          <div className="w-4 h-2 bg-secondary rounded-sm m-0.5"></div>
        </div>
      </div>
    </div>
  );
}
