import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
// multer doesn't ship types in this workspace; ignore TS errors for the import
// @ts-ignore
import multer from "multer";
import { storage } from "./storage";
import { 
  insertTouristSchema, 
  insertIncidentSchema, 
  insertEmergencyContactSchema,
  insertLocationHistorySchema,
  insertSafetyAlertSchema
} from "@shared/schema";
import { TouristSafetyScore } from "@shared/schema";

function computeSafetyScore(params: { incidents: any[]; alerts: any[]; locations: any[]; safetyZones: any[]; }): TouristSafetyScore {
  const { incidents, alerts, locations, safetyZones } = params;
  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const highRiskZones = safetyZones.filter((z: any) => z.type === 'high-risk');
  // naive visit heuristic: any location within radius of a high-risk zone counts as visit
  let highRiskVisits = 0;
  for (const loc of locations) {
    for (const zone of highRiskZones) {
      const lat = parseFloat(String(loc.latitude));
      const lng = parseFloat(String(loc.longitude));
      const zLat = parseFloat(String(zone.centerLatitude));
      const zLng = parseFloat(String(zone.centerLongitude));
      if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(zLat) && Number.isFinite(zLng)) {
        const d = Math.sqrt(Math.pow(lat - zLat, 2) + Math.pow(lng - zLng, 2));
        if (d < 0.01) { // rough proximity threshold
          highRiskVisits++;
          break;
        }
      }
    }
  }
  const activeAlerts = alerts.length;
  // scoring: start 100, subtract weighted risk
  let score = 100;
  score -= highRiskVisits * 5; // each risky visit cost 5
  score -= openIncidents.length * 8; // each open incident cost 8
  score -= activeAlerts * 3; // each active alert cost 3
  if (score < 0) score = 0;
  const level = score >= 70 ? 'low' : score >= 40 ? 'moderate' : 'high';
  const recommendations: string[] = [];
  if (highRiskVisits > 0) recommendations.push('Reduce time in high-risk zones');
  if (openIncidents.length > 0) recommendations.push('Follow up on open incidents');
  if (activeAlerts > 1) recommendations.push('Monitor active safety alerts');
  if (recommendations.length === 0) recommendations.push('Maintain current safe travel habits');
  return {
    score: Math.round(score),
    level,
    factors: {
      highRiskZoneVisits: highRiskVisits,
      openIncidents: openIncidents.length,
      activeAlerts,
    },
    recommendations,
    updatedAt: new Date().toISOString(),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ensure uploads directory
  const uploadsRoot = path.join(process.cwd(), "server", "uploads");
  const tripsUploadDir = path.join(uploadsRoot, "trips");
  const logosUploadDir = path.join(uploadsRoot, "logos");
  if (!fs.existsSync(tripsUploadDir)) {
    fs.mkdirSync(tripsUploadDir, { recursive: true });
  }
  if (!fs.existsSync(logosUploadDir)) {
    fs.mkdirSync(logosUploadDir, { recursive: true });
  }

  // serve uploaded files under /uploads
  app.use('/uploads', express.static(uploadsRoot));

  const storageEngine = multer.diskStorage({
    destination: function (_req: any, _file: any, cb: any) {
      cb(null, tripsUploadDir);
    },
    filename: function (_req: any, file: any, cb: any) {
      // prefix with timestamp to avoid collisions
      const safe = Date.now() + '-' + String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, safe);
    }
  });

  const upload = multer({ storage: storageEngine });

  // separate storage for logos
  const logosStorageEngine = multer.diskStorage({
    destination: function (_req: any, _file: any, cb: any) {
      cb(null, logosUploadDir);
    },
    filename: function (_req: any, file: any, cb: any) {
      const safe = Date.now() + '-' + String(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, safe);
    }
  });

  const logosUpload = multer({ 
    storage: logosStorageEngine,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: function (_req: any, file: any, cb: any) {
      const accepted = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (accepted.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Invalid file type'));
    }
  });

  // Tourist routes
  app.post("/api/tourists", async (req, res) => {
    try {
      const data = insertTouristSchema.parse(req.body);
      const tourist = await storage.createTourist(data);
      res.json(tourist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create tourist with optional logo upload (multipart/form-data)
  app.post('/api/tourists-with-logo', logosUpload.single('logo'), async (req, res) => {
    try {
      const anyReq: any = req;
      const { name, passportNumber, aadhaarNumber, nationality, emergencyContact } = req.body as any;
      const idNumber = passportNumber || aadhaarNumber || '';

      const payload = { name, idNumber, nationality, emergencyContact } as any;
      // create tourist record
      const tourist = await storage.createTourist(payload);

      // if logo uploaded, attach logoUrl to tourist record
      if (anyReq.file && anyReq.file.filename) {
        const logoUrl = `/uploads/logos/${anyReq.file.filename}`;
        // cast to any because Tourist type doesn't include logoUrl in schema
        await storage.updateTourist(tourist.id, { logoUrl } as any);
        const updated = await storage.getTourist(tourist.id);
        return res.json(updated);
      }

      res.json(tourist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tourists/:id", async (req, res) => {
    try {
      const tourist = await storage.getTourist(req.params.id);
      if (!tourist) {
        return res.status(404).json({ message: "Tourist not found" });
      }
      res.json(tourist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tourists/id-number/:idNumber", async (req, res) => {
    try {
      const tourist = await storage.getTouristByIdNumber(req.params.idNumber);
      if (!tourist) {
        return res.status(404).json({ message: "Tourist not found" });
      }
      res.json(tourist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Emergency contact routes
  app.get("/api/tourists/:touristId/emergency-contacts", async (req, res) => {
    try {
      const contacts = await storage.getEmergencyContacts(req.params.touristId);
      res.json(contacts);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const data = insertEmergencyContactSchema.parse(req.body);
      const contact = await storage.createEmergencyContact(data);
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch('/api/emergency-contacts/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body as any;
      const contact = await storage.updateEmergencyContact(id, updates);
      if (!contact) return res.status(404).json({ message: 'Emergency contact not found' });
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Incident routes
  app.get("/api/incidents", async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      res.json(incidents);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/tourists/:touristId/incidents", async (req, res) => {
    try {
      const incidents = await storage.getIncidentsByTourist(req.params.touristId);
      res.json(incidents);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const data = insertIncidentSchema.parse(req.body);
      const incident = await storage.createIncident(data);
      res.json(incident);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/incidents/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const incident = await storage.updateIncidentStatus(req.params.id, status);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Safety zone routes
  app.get("/api/safety-zones", async (req, res) => {
    try {
      const zones = await storage.getSafetyZones();
      res.json(zones);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Trip itineraries - create a trip record (accept optional file upload)
  app.post('/api/trip-itineraries', upload.single('itinerary'), async (req, res) => {
    try {
      const { touristId, itineraryName } = req.body;
      let itineraryUrl: string | null = null;
      const anyReq: any = req;
      if (anyReq.file && anyReq.file.filename) {
        itineraryUrl = `/uploads/trips/${anyReq.file.filename}`;
      } else if (req.body.itineraryUrl) {
        itineraryUrl = req.body.itineraryUrl;
      }

      const trip = await storage.createTrip({ touristId, itineraryUrl: itineraryUrl || null, itineraryName, isActive: false });
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Start a trip (activate) and notify authorities
  app.post('/api/trips/start', async (req, res) => {
    try {
      const { tripId } = req.body;
      const trip = await storage.startTrip(tripId);
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      // notify authorities
      await storage.createSafetyAlert({ title: 'Trip started', message: `User ${trip.touristId} started a trip`, type: 'info', area: 'unknown', expiresAt: null });
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // End a trip (deactivate) and notify authorities
  app.post('/api/trips/end', async (req, res) => {
    try {
      const { tripId } = req.body;
      const trip = await storage.endTrip(tripId);
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      await storage.createSafetyAlert({ title: 'Trip ended', message: `User ${trip.touristId} ended their trip`, type: 'info', area: 'unknown', expiresAt: null });
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Tourist safety score route
  app.get('/api/tourists/:touristId/safety-score', async (req, res) => {
    try {
      const touristId = req.params.touristId;
      const [incidents, alerts, locations, zones] = await Promise.all([
        storage.getIncidentsByTourist(touristId),
        storage.getActiveSafetyAlerts(),
        storage.getLocationHistory(touristId),
        storage.getSafetyZones(),
      ]);
      const score = computeSafetyScore({ incidents, alerts, locations, safetyZones: zones });
      res.json(score);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/trips/active', async (req, res) => {
    try {
      const trips = await storage.getActiveTrips();
      res.json(trips);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all trips (persisted)
  app.get('/api/trips', async (req, res) => {
    try {
      const limit = parseInt(String(req.query.limit ?? '20'), 10);
      const offset = parseInt(String(req.query.offset ?? '0'), 10);
      const trips = await storage.getTripsPaged(limit, offset);
      res.json(trips);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get single trip
  app.get('/api/trips/:id', async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) return res.status(404).json({ message: 'Trip not found' });
      res.json(trip);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Heatmap data for incidents: returns array of [lat, lng, intensity]
  app.get("/api/incident-heatmap", async (req, res) => {
    try {
      const incidents = await storage.getIncidents();
      const points = incidents
        .filter(i => i.latitude != null && i.longitude != null)
        .map(i => [parseFloat(String(i.latitude)), parseFloat(String(i.longitude)), 0.5]);
      res.json(points);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Location tracking routes
  app.get("/api/tourists/:touristId/location-history", async (req, res) => {
    try {
      const locations = await storage.getLocationHistory(req.params.touristId);
      res.json(locations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/location-history", async (req, res) => {
    try {
      const data = insertLocationHistorySchema.parse(req.body);
      const location = await storage.addLocationHistory(data);
      res.json(location);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Safety alert routes
  app.get("/api/safety-alerts", async (req, res) => {
    try {
      const alerts = await storage.getActiveSafetyAlerts();
      res.json(alerts);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Translate proxy (scaffold) - requires GOOGLE_TRANSLATE_KEY in env
  app.post('/api/translate', express.json(), async (req, res) => {
    const { text, target } = req.body as any;
    const key = process.env.GOOGLE_TRANSLATE_KEY;
    if (!key) {
      return res.status(501).json({ message: 'Translate API not configured on server' });
    }

    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${key}`;
      const body = { q: text, target };
      const fetchRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!fetchRes.ok) {
        const txt = await fetchRes.text();
        return res.status(500).json({ message: txt });
      }
      const data = await fetchRes.json();
      const translated = data?.data?.translations?.[0]?.translatedText ?? null;
      res.json({ translated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/safety-alerts", async (req, res) => {
    try {
      const data = insertSafetyAlertSchema.parse(req.body);
      const alert = await storage.createSafetyAlert(data);
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Audit log endpoints
  app.get('/api/audit-log', async (_req, res) => {
    try {
      const log = await storage.getAuditLog();
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/audit-log/verify', async (_req, res) => {
    try {
      const result = await storage.verifyAuditChain();
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
