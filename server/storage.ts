import { 
  type Tourist, type InsertTourist,
  type EmergencyContact, type InsertEmergencyContact,
  type Incident, type InsertIncident,
  type SafetyZone, type InsertSafetyZone,
  type LocationHistory, type InsertLocationHistory,
  type SafetyAlert, type InsertSafetyAlert
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Tourist operations
  getTourist(id: string): Promise<Tourist | undefined>;
  getTouristByIdNumber(idNumber: string): Promise<Tourist | undefined>;
  createTourist(tourist: InsertTourist): Promise<Tourist>;
  updateTourist(id: string, updates: Partial<Tourist>): Promise<Tourist | undefined>;
  
  // Emergency contact operations
  getEmergencyContacts(touristId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  
  // Incident operations
  getIncidents(): Promise<Incident[]>;
  getIncidentsByTourist(touristId: string): Promise<Incident[]>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncidentStatus(id: string, status: string): Promise<Incident | undefined>;
  
  // Safety zone operations
  getSafetyZones(): Promise<SafetyZone[]>;
  createSafetyZone(zone: InsertSafetyZone): Promise<SafetyZone>;
  
  // Location operations
  getLocationHistory(touristId: string): Promise<LocationHistory[]>;
  addLocationHistory(location: InsertLocationHistory): Promise<LocationHistory>;
  
  // Safety alert operations
  getActiveSafetyAlerts(): Promise<SafetyAlert[]>;
  createSafetyAlert(alert: InsertSafetyAlert): Promise<SafetyAlert>;
}

export class MemStorage implements IStorage {
  private tourists: Map<string, Tourist>;
  private emergencyContacts: Map<string, EmergencyContact>;
  private incidents: Map<string, Incident>;
  private safetyZones: Map<string, SafetyZone>;
  private locationHistory: Map<string, LocationHistory>;
  private safetyAlerts: Map<string, SafetyAlert>;

  constructor() {
    this.tourists = new Map();
    this.emergencyContacts = new Map();
    this.incidents = new Map();
    this.safetyZones = new Map();
    this.locationHistory = new Map();
    this.safetyAlerts = new Map();
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default safety zones
    const defaultZones: SafetyZone[] = [
      {
        id: randomUUID(),
        name: "Downtown Tourist District",
        centerLatitude: "40.7589",
        centerLongitude: "-73.9851",
        radius: "500",
        type: "safe",
        isActive: true,
      },
      {
        id: randomUUID(),
        name: "Central Park South",
        centerLatitude: "40.7679",
        centerLongitude: "-73.9781",
        radius: "300",
        type: "safe",
        isActive: true,
      },
    ];

    defaultZones.forEach(zone => this.safetyZones.set(zone.id, zone));

    // Create default safety alerts
    const defaultAlerts: SafetyAlert[] = [
      {
        id: randomUUID(),
        title: "High Traffic Advisory",
        message: "Times Square area experiencing heavy crowds. Consider alternate routes.",
        type: "warning",
        area: "Times Square",
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: null,
      },
      {
        id: randomUUID(),
        title: "Weather Update",
        message: "Light rain expected this evening. Carry an umbrella if heading out.",
        type: "info",
        area: "Citywide",
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        expiresAt: null,
      },
    ];

    defaultAlerts.forEach(alert => this.safetyAlerts.set(alert.id, alert));
  }

  // Tourist operations
  async getTourist(id: string): Promise<Tourist | undefined> {
    return this.tourists.get(id);
  }

  async getTouristByIdNumber(idNumber: string): Promise<Tourist | undefined> {
    return Array.from(this.tourists.values()).find(
      (tourist) => tourist.idNumber === idNumber,
    );
  }

  async createTourist(insertTourist: InsertTourist): Promise<Tourist> {
    const id = randomUUID();
    const blockchainHash = `0x${Math.random().toString(16).substring(2, 10)}...`;
    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    const tourist: Tourist = { 
      ...insertTourist, 
      id, 
      blockchainHash,
      issuedAt,
      expiresAt,
      isActive: true,
    };
    this.tourists.set(id, tourist);
    return tourist;
  }

  async updateTourist(id: string, updates: Partial<Tourist>): Promise<Tourist | undefined> {
    const tourist = this.tourists.get(id);
    if (!tourist) return undefined;
    
    const updated = { ...tourist, ...updates };
    this.tourists.set(id, updated);
    return updated;
  }

  // Emergency contact operations
  async getEmergencyContacts(touristId: string): Promise<EmergencyContact[]> {
    return Array.from(this.emergencyContacts.values()).filter(
      contact => contact.touristId === touristId
    );
  }

  async createEmergencyContact(insertContact: InsertEmergencyContact): Promise<EmergencyContact> {
    const id = randomUUID();
    const contact: EmergencyContact = { ...insertContact, id };
    this.emergencyContacts.set(id, contact);
    return contact;
  }

  // Incident operations
  async getIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).sort(
      (a, b) => b.reportedAt.getTime() - a.reportedAt.getTime()
    );
  }

  async getIncidentsByTourist(touristId: string): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(
      incident => incident.touristId === touristId
    );
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const id = randomUUID();
    const incident: Incident = { 
      ...insertIncident, 
      id, 
      reportedAt: new Date(),
      status: "open",
    };
    this.incidents.set(id, incident);
    return incident;
  }

  async updateIncidentStatus(id: string, status: string): Promise<Incident | undefined> {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;
    
    incident.status = status;
    this.incidents.set(id, incident);
    return incident;
  }

  // Safety zone operations
  async getSafetyZones(): Promise<SafetyZone[]> {
    return Array.from(this.safetyZones.values()).filter(zone => zone.isActive);
  }

  async createSafetyZone(insertZone: InsertSafetyZone): Promise<SafetyZone> {
    const id = randomUUID();
    const zone: SafetyZone = { ...insertZone, id, isActive: true };
    this.safetyZones.set(id, zone);
    return zone;
  }

  // Location operations
  async getLocationHistory(touristId: string): Promise<LocationHistory[]> {
    return Array.from(this.locationHistory.values())
      .filter(location => location.touristId === touristId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async addLocationHistory(insertLocation: InsertLocationHistory): Promise<LocationHistory> {
    const id = randomUUID();
    const location: LocationHistory = { 
      ...insertLocation, 
      id, 
      timestamp: new Date(),
    };
    this.locationHistory.set(id, location);
    return location;
  }

  // Safety alert operations
  async getActiveSafetyAlerts(): Promise<SafetyAlert[]> {
    const now = new Date();
    return Array.from(this.safetyAlerts.values()).filter(
      alert => alert.isActive && (!alert.expiresAt || alert.expiresAt > now)
    );
  }

  async createSafetyAlert(insertAlert: InsertSafetyAlert): Promise<SafetyAlert> {
    const id = randomUUID();
    const alert: SafetyAlert = { 
      ...insertAlert, 
      id, 
      createdAt: new Date(),
      isActive: true,
    };
    this.safetyAlerts.set(id, alert);
    return alert;
  }
}

export const storage = new MemStorage();
