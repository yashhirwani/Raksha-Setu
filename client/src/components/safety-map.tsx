import { useEffect, useRef, useState } from "react";

interface SafetyZone {
  id: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  radius: string;
  type: string;
}

interface Incident {
  id: string;
  latitude?: string;
  longitude?: string;
  type: string;
}

interface SafetyMapProps {
  safetyZones: SafetyZone[];
  incidents: Incident[];
  touristId: string;
}

export default function SafetyMap({ safetyZones, incidents, touristId }: SafetyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState({ lat: 40.7589, lng: -73.9851 });

  useEffect(() => {
    // Simulate getting user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Use default NYC location if geolocation fails
          setUserLocation({ lat: 40.7589, lng: -73.9851 });
        }
      );
    }
  }, []);

  // For now, we'll use a static map image with overlays
  // In a real implementation, you would use react-leaflet here
  return (
    <div ref={mapRef} className="w-full h-full relative">
      {/* Map Background */}
      <img 
        src="https://images.unsplash.com/photo-1524813686514-a57563d77965?ixlib=rb-4.0.3&auto=format&fit=crop&w=430&h=384" 
        alt="City map view" 
        className="w-full h-full object-cover"
      />
      
      {/* Safety Zones Overlay */}
      {safetyZones.map((zone, index) => (
        <div
          key={zone.id}
          className="safety-zone absolute"
          style={{
            width: `${Math.min(80, parseInt(zone.radius) / 10)}px`,
            height: `${Math.min(80, parseInt(zone.radius) / 10)}px`,
            top: `${20 + (index * 30)}%`,
            left: `${15 + (index * 25)}%`,
          }}
          data-testid={`safety-zone-${zone.id}`}
        />
      ))}
      
      {/* Current Location */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 bg-primary rounded-full border-4 border-primary-foreground shadow-lg relative" data-testid="user-location">
          <div className="w-8 h-8 border-2 border-primary rounded-full absolute -top-2 -left-2 animate-ping opacity-50"></div>
        </div>
      </div>
      
      {/* Incident Markers */}
      {incidents.slice(0, 3).map((incident, index) => (
        <div
          key={incident.id}
          className="incident-marker w-3 h-3 absolute"
          style={{
            top: `${25 + (index * 20)}%`,
            right: `${20 + (index * 15)}%`,
          }}
          data-testid={`incident-marker-${incident.id}`}
        />
      ))}
    </div>
  );
}
