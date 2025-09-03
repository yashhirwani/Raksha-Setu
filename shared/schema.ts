import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tourist profiles with digital ID
export const tourists = pgTable("tourists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  idNumber: text("id_number").notNull().unique(),
  nationality: text("nationality").notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  blockchainHash: text("blockchain_hash").notNull().unique(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Emergency contacts for tourists
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  touristId: varchar("tourist_id").notNull().references(() => tourists.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
});

// Incident reports
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  touristId: varchar("tourist_id").references(() => tourists.id),
  type: text("type").notNull(), // medical, safety, accident, suspicious
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // low, medium, high
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  status: text("status").default("open").notNull(), // open, investigating, resolved
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  photoUrls: jsonb("photo_urls").default([]),
});

// Safety zones for geo-fencing
export const safetyZones = pgTable("safety_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  centerLatitude: decimal("center_latitude", { precision: 10, scale: 7 }).notNull(),
  centerLongitude: decimal("center_longitude", { precision: 10, scale: 7 }).notNull(),
  radius: decimal("radius").notNull(), // in meters
  type: text("type").notNull(), // safe, restricted, high-risk
  isActive: boolean("is_active").default(true).notNull(),
});

// Location tracking for tourists
export const locationHistory = pgTable("location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  touristId: varchar("tourist_id").notNull().references(() => tourists.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  inSafeZone: boolean("in_safe_zone").default(true).notNull(),
});

// Safety alerts
export const safetyAlerts = pgTable("safety_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // warning, info, emergency
  area: text("area").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Insert schemas
export const insertTouristSchema = createInsertSchema(tourists).omit({
  id: true,
  blockchainHash: true,
  issuedAt: true,
  expiresAt: true,
  isActive: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  reportedAt: true,
  status: true,
});

export const insertSafetyZoneSchema = createInsertSchema(safetyZones).omit({
  id: true,
  isActive: true,
});

export const insertLocationHistorySchema = createInsertSchema(locationHistory).omit({
  id: true,
  timestamp: true,
});

export const insertSafetyAlertSchema = createInsertSchema(safetyAlerts).omit({
  id: true,
  createdAt: true,
  isActive: true,
});

// Types
export type Tourist = typeof tourists.$inferSelect;
export type InsertTourist = z.infer<typeof insertTouristSchema>;

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type SafetyZone = typeof safetyZones.$inferSelect;
export type InsertSafetyZone = z.infer<typeof insertSafetyZoneSchema>;

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = z.infer<typeof insertLocationHistorySchema>;

export type SafetyAlert = typeof safetyAlerts.$inferSelect;
export type InsertSafetyAlert = z.infer<typeof insertSafetyAlertSchema>;
