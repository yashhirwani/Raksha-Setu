import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTouristSchema, 
  insertIncidentSchema, 
  insertEmergencyContactSchema,
  insertLocationHistorySchema,
  insertSafetyAlertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/safety-alerts", async (req, res) => {
    try {
      const data = insertSafetyAlertSchema.parse(req.body);
      const alert = await storage.createSafetyAlert(data);
      res.json(alert);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
