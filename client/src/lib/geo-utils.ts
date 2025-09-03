export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SafetyZone {
  id: string;
  name: string;
  centerLatitude: string;
  centerLongitude: string;
  radius: string;
  type: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a coordinate is within a safety zone
 */
export function isInSafetyZone(
  userLocation: Coordinates, 
  safetyZone: SafetyZone
): boolean {
  const zoneCenter: Coordinates = {
    latitude: parseFloat(safetyZone.centerLatitude),
    longitude: parseFloat(safetyZone.centerLongitude),
  };
  
  const distance = calculateDistance(userLocation, zoneCenter);
  const radius = parseFloat(safetyZone.radius);
  
  return distance <= radius;
}

/**
 * Find the nearest safety zone to a given location
 */
export function findNearestSafetyZone(
  userLocation: Coordinates,
  safetyZones: SafetyZone[]
): SafetyZone | null {
  if (safetyZones.length === 0) return null;
  
  let nearest = safetyZones[0];
  let minDistance = Number.MAX_VALUE;
  
  for (const zone of safetyZones) {
    const zoneCenter: Coordinates = {
      latitude: parseFloat(zone.centerLatitude),
      longitude: parseFloat(zone.centerLongitude),
    };
    
    const distance = calculateDistance(userLocation, zoneCenter);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = zone;
    }
  }
  
  return nearest;
}

/**
 * Generate a safety score based on location and recent incidents
 */
export function calculateSafetyScore(
  userLocation: Coordinates,
  safetyZones: SafetyZone[],
  recentIncidents: any[]
): number {
  let score = 50; // Base score
  
  // Increase score if in a safe zone
  const inSafeZone = safetyZones.some(zone => 
    zone.type === 'safe' && isInSafetyZone(userLocation, zone)
  );
  
  if (inSafeZone) {
    score += 30;
  }
  
  // Decrease score based on nearby incidents
  const nearbyIncidents = recentIncidents.filter(incident => {
    if (!incident.latitude || !incident.longitude) return false;
    
    const incidentLocation: Coordinates = {
      latitude: parseFloat(incident.latitude),
      longitude: parseFloat(incident.longitude),
    };
    
    const distance = calculateDistance(userLocation, incidentLocation);
    return distance <= 1000; // Within 1km
  });
  
  score -= nearbyIncidents.length * 10;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get current user location using browser geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
