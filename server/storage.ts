import fs from "fs";
import path from "path";
import { 
  type Tourist, type InsertTourist,
  type EmergencyContact, type InsertEmergencyContact,
  type Incident, type InsertIncident,
  type SafetyZone, type InsertSafetyZone,
  type LocationHistory, type InsertLocationHistory,
  type SafetyAlert, type InsertSafetyAlert,
  type SafetyEventLogEntry
} from "@shared/schema";
import { randomUUID } from "crypto";
import crypto from 'crypto';

export interface IStorage {
  // Tourist operations
  getTourist(id: string): Promise<Tourist | undefined>;
  getTouristByIdNumber(idNumber: string): Promise<Tourist | undefined>;
  createTourist(tourist: InsertTourist): Promise<Tourist>;
  updateTourist(id: string, updates: Partial<Tourist>): Promise<Tourist | undefined>;
  
  // Emergency contact operations
  getEmergencyContacts(touristId: string): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | undefined>;
  
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

  // Trip operations
  createTrip(trip: any): Promise<any>;
  startTrip(tripId: string): Promise<any | undefined>;
  endTrip(tripId: string): Promise<any | undefined>;
  getActiveTrips(): Promise<any[]>;
  
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
  private trips: Map<string, any>;
  private auditLog: SafetyEventLogEntry[];

  constructor() {
    this.tourists = new Map();
    this.emergencyContacts = new Map();
    this.incidents = new Map();
    this.safetyZones = new Map();
    this.locationHistory = new Map();
    this.safetyAlerts = new Map();
  this.trips = new Map();
    this.auditLog = [];
    // load persisted trips from disk if present
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      const tripsFile = path.join(dataDir, 'trips.json');
      if (fs.existsSync(tripsFile)) {
        const raw = fs.readFileSync(tripsFile, 'utf-8');
        const arr = JSON.parse(raw) as any[];
        arr.forEach(t => this.trips.set(t.id, { ...t, createdAt: new Date(t.createdAt), startAt: t.startAt ? new Date(t.startAt) : undefined, endAt: t.endAt ? new Date(t.endAt) : undefined }));
      } else {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (err) {
      // ignore load errors and continue with empty trips map
    }
    // load persisted tourists from disk if present
    // load audit log if present
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      const auditFile = path.join(dataDir, 'audit-log.json');
      if (fs.existsSync(auditFile)) {
        const raw = fs.readFileSync(auditFile, 'utf-8');
        const arr = JSON.parse(raw) as SafetyEventLogEntry[];
        this.auditLog = arr;
      }
    } catch (err) {
      // ignore
    }
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      const touristsFile = path.join(dataDir, 'tourists.json');
      if (fs.existsSync(touristsFile)) {
        const raw = fs.readFileSync(touristsFile, 'utf-8');
        const arr = JSON.parse(raw) as any[];
        arr.forEach(t => this.tourists.set(t.id, { ...t, issuedAt: t.issuedAt ? new Date(t.issuedAt) : new Date(), expiresAt: t.expiresAt ? new Date(t.expiresAt) : new Date() } as any));
      }
    } catch (err) {
      // ignore
    }
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
      {
        id: randomUUID(),
        name: "Demo Danger Zone",
        centerLatitude: "40.7605",
        centerLongitude: "-73.9832",
        radius: "250",
        type: "high-risk",
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
        latitude: null,
        longitude: null,
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
        latitude: null,
        longitude: null,
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
    // There may be duplicate records with the same idNumber (from previous runs).
    // Prefer the most recently issued record so APIs return the newest Digital ID.
    const matches = Array.from(this.tourists.values()).filter(t => t.idNumber === idNumber);
    if (matches.length === 0) return undefined;
    matches.sort((a, b) => {
      const aTime = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const bTime = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      return bTime - aTime; // newest first
    });
    return matches[0];
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
    } as any;
    this.tourists.set(id, tourist);
    // persist tourists to disk
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const touristsFile = path.join(dataDir, 'tourists.json');
      const arr = Array.from(this.tourists.values()).map(t => ({ ...t, issuedAt: t.issuedAt ? new Date(t.issuedAt).toISOString() : null, expiresAt: t.expiresAt ? new Date(t.expiresAt).toISOString() : null }));
      fs.writeFileSync(touristsFile, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      // ignore
    }
    return tourist;
  }

  async updateTourist(id: string, updates: Partial<Tourist>): Promise<Tourist | undefined> {
    const tourist = this.tourists.get(id);
    if (!tourist) return undefined;
    
    const updated = { ...tourist, ...updates };
    this.tourists.set(id, updated);
    // persist tourists to disk
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const touristsFile = path.join(dataDir, 'tourists.json');
      const arr = Array.from(this.tourists.values()).map(t => ({ ...t, issuedAt: t.issuedAt ? new Date(t.issuedAt).toISOString() : null, expiresAt: t.expiresAt ? new Date(t.expiresAt).toISOString() : null }));
      fs.writeFileSync(touristsFile, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      // ignore
    }
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
    const contact: EmergencyContact = { ...insertContact, id, isPrimary: insertContact.isPrimary ?? false };
    this.emergencyContacts.set(id, contact);
    return contact;
  }

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | undefined> {
    const contact = this.emergencyContacts.get(id);
    if (!contact) return undefined;
    const updated = { ...contact, ...updates };
    // If marking as primary, unset other primary contacts for the tourist
    if (updates.isPrimary) {
      Array.from(this.emergencyContacts.values()).forEach(c => {
        if (c.touristId === contact.touristId && c.id !== id && c.isPrimary) {
          this.emergencyContacts.set(c.id, { ...c, isPrimary: false });
        }
      });
    }
    this.emergencyContacts.set(id, updated as EmergencyContact);
    return updated as EmergencyContact;
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
      touristId: (insertIncident as any).touristId ?? null,
      latitude: (insertIncident as any).latitude ?? null,
      longitude: (insertIncident as any).longitude ?? null,
      isAnonymous: (insertIncident as any).isAnonymous ?? false,
      photoUrls: (insertIncident as any).photoUrls ?? [],
    } as unknown as Incident;
    this.incidents.set(id, incident);
    await this.recordAuditEvent('incident', id, {
      type: incident.type,
      priority: incident.priority,
      touristId: incident.touristId,
      reportedAt: incident.reportedAt.toISOString()
    });
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
      inSafeZone: insertLocation.inSafeZone ?? true,
    } as unknown as LocationHistory;
    this.locationHistory.set(id, location);
    return location;
  }

  // Trip operations
  async createTrip(trip: any): Promise<any> {
    const id = randomUUID();
    const newTrip = { ...trip, id, isActive: trip.isActive ?? false, createdAt: new Date() };
    this.trips.set(id, newTrip);
    await this.saveTripsToDisk();
    return newTrip;
  }

  async startTrip(tripId: string): Promise<any | undefined> {
    const trip = this.trips.get(tripId);
    if (!trip) return undefined;
    trip.isActive = true;
    trip.startAt = new Date();
    this.trips.set(tripId, trip);
    await this.saveTripsToDisk();
    return trip;
  }

  async endTrip(tripId: string): Promise<any | undefined> {
    const trip = this.trips.get(tripId);
    if (!trip) return undefined;
    trip.isActive = false;
    trip.endAt = new Date();
    this.trips.set(tripId, trip);
    await this.saveTripsToDisk();
    return trip;
  }

  private async saveTripsToDisk() {
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const tripsFile = path.join(dataDir, 'trips.json');
      const arr = Array.from(this.trips.values()).map(t => ({ ...t, createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null, startAt: t.startAt ? new Date(t.startAt).toISOString() : null, endAt: t.endAt ? new Date(t.endAt).toISOString() : null }));
      fs.writeFileSync(tripsFile, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      // ignore persist errors
    }
  }

  async getActiveTrips(): Promise<any[]> {
    return Array.from(this.trips.values()).filter(t => t.isActive);
  }

  // Return all trips (persisted)
  async getAllTrips(): Promise<any[]> {
    return Array.from(this.trips.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get single trip by id
  async getTrip(tripId: string): Promise<any | undefined> {
    return this.trips.get(tripId);
  }

  // Get trips with pagination
  async getTripsPaged(limit = 20, offset = 0): Promise<any[]> {
    const arr = Array.from(this.trips.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return arr.slice(offset, offset + limit);
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
      latitude: typeof insertAlert.latitude === 'number' ? insertAlert.latitude : undefined,
      longitude: typeof insertAlert.longitude === 'number' ? insertAlert.longitude : undefined,
      createdAt: new Date(),
      isActive: true,
      expiresAt: insertAlert.expiresAt ?? null,
    } as unknown as SafetyAlert;
    this.safetyAlerts.set(id, alert);
    await this.recordAuditEvent('alert', id, {
      title: alert.title,
      area: alert.area,
      type: alert.type,
      createdAt: alert.createdAt.toISOString()
    });
    return alert;
  }

  // ----- Audit Log Methods -----
  private async saveAuditLog() {
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const auditFile = path.join(dataDir, 'audit-log.json');
      fs.writeFileSync(auditFile, JSON.stringify(this.auditLog, null, 2), 'utf-8');
    } catch (err) {
      // ignore
    }
  }

  private sha256Hex(input: string) {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  async recordAuditEvent(type: 'incident' | 'alert', refId: string, payload: any) {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    const payloadHash = this.sha256Hex(canonical);
    const previous = this.auditLog.length ? this.auditLog[this.auditLog.length - 1].chainHash : null;
    const chainHash = this.sha256Hex((previous ?? '') + payloadHash);
    const entry: SafetyEventLogEntry = {
      id: randomUUID(),
      type,
      refId,
      timestamp: new Date().toISOString(),
      payloadHash,
      previousHash: previous,
      chainHash,
    };
    this.auditLog.push(entry);
    await this.saveAuditLog();
    return entry;
  }

  async getAuditLog(): Promise<SafetyEventLogEntry[]> {
    return this.auditLog.slice();
  }

  async verifyAuditChain(): Promise<{ valid: boolean; length: number; lastHash: string | null; brokenIndex: number | null; }>{
    let prev: string | null = null;
    for (let i = 0; i < this.auditLog.length; i++) {
      const e = this.auditLog[i];
      if (e.previousHash !== prev) {
        return { valid: false, length: this.auditLog.length, lastHash: this.auditLog[this.auditLog.length-1]?.chainHash || null, brokenIndex: i };
      }
      const recompute = this.sha256Hex((prev ?? '') + e.payloadHash);
      if (recompute !== e.chainHash) {
        return { valid: false, length: this.auditLog.length, lastHash: this.auditLog[this.auditLog.length-1]?.chainHash || null, brokenIndex: i };
      }
      prev = e.chainHash;
    }
    return { valid: true, length: this.auditLog.length, lastHash: this.auditLog[this.auditLog.length-1]?.chainHash || null, brokenIndex: null };
  }
}

export const storage = new MemStorage();
