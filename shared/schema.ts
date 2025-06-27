import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  role: varchar("role").default("viewer").notNull(),
  isActive: boolean("is_active").default(false).notNull(), // Default to false, requires admin approval
  isPending: boolean("is_pending").default(true).notNull(), // New accounts start as pending
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table for internal authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").default("viewer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  dateAdded: timestamp("date_added").defaultNow(),
  name: text("name").notNull(),
  description: text("description"),
  drivingLicenses: text("driving_licenses").array().default([]),
  drivingLicenseNotes: text("driving_license_notes"),
  city: text("city"),
  region: text("region"),
  marketing: text("marketing"),
  phone: text("phone"),
  email: text("email"),
  status: text("status").default("active"), // active, placed, inactive
  phase: text("phase").default("intake"), // intake, matching, placed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients/Employers table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  location: text("location"),
  workType: text("work_type"),
  adresHoofdlocatie: text("adres_hoofdlocatie"),
  afspraken: text("afspraken"),
  notities: text("notities"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client locations table
export const clientLocations = pgTable("client_locations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  naamLocatie: text("naam_locatie").notNull(),
  functie: text("functie"),
  adres: text("adres"),
  opmerkingen: text("opmerkingen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client contacts table
export const clientContacts = pgTable("client_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  naam: text("naam").notNull(),
  rol: text("rol"),
  telefoonnummer: text("telefoonnummer"),
  emailadres: text("emailadres"),
  geboortedatum: date("geboortedatum"),
  opmerkingen: text("opmerkingen"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trajectories table
export const trajectories = pgTable("trajectories", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id),
  clientId: integer("client_id").references(() => clients.id),
  startDate: date("start_date"),
  status: text("status").default("interview"), // interview, proposed, placed
  jobTitle: text("job_title"),
  hourlyRate: text("hourly_rate"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // candidate, trajectory, client
  entityId: integer("entity_id").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // candidate, trajectory, client
  entityId: integer("entity_id").notNull(),
  filename: text("filename").notNull(),
  storageUrl: text("storage_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete
  changes: jsonb("changes"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const candidatesRelations = relations(candidates, ({ many }) => ({
  trajectories: many(trajectories),
  notes: many(notes),
  documents: many(documents),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  trajectories: many(trajectories),
  notes: many(notes),
  documents: many(documents),
  locations: many(clientLocations),
  contacts: many(clientContacts),
}));

export const clientLocationsRelations = relations(clientLocations, ({ one }) => ({
  client: one(clients, {
    fields: [clientLocations.clientId],
    references: [clients.id],
  }),
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
}));

export const trajectoriesRelations = relations(trajectories, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [trajectories.candidateId],
    references: [candidates.id],
  }),
  client: one(clients, {
    fields: [trajectories.clientId],
    references: [clients.id],
  }),
  notes: many(notes),
  documents: many(documents),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, {
    fields: [notes.authorId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  // Relations can be added if needed for specific entity types
}));

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  auditLogs: many(auditLog),
}));

// Insert schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Ongeldig e-mailadres").optional().nullable(),
  dateAdded: z.date().optional().nullable(),
  region: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  drivingLicenses: z.array(z.string()).optional().nullable(),
  drivingLicenseNotes: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phase: z.string().optional().nullable(),
  marketing: z.string().optional().nullable(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Bedrijfsnaam is verplicht"),
  contactPerson: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  workType: z.string().optional().nullable(),
  adresHoofdlocatie: z.string().optional().nullable(),
  notities: z.string().optional().nullable(),
});

export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  clientId: z.number().min(1, "Client ID is verplicht"),
  naamLocatie: z.string().min(1, "Locatienaam is verplicht"),
  functie: z.string().optional().nullable(),
  adres: z.string().optional().nullable(),
  opmerkingen: z.string().optional().nullable(),
});

export const insertClientContactSchema = createInsertSchema(clientContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  clientId: z.number().min(1, "Client ID is verplicht"),
  naam: z.string().min(1, "Naam is verplicht"),
  rol: z.string().optional().nullable().transform(val => val === "" ? null : val),
  telefoonnummer: z.string().optional().nullable().transform(val => val === "" ? null : val),
  emailadres: z.string().email("Ongeldig e-mailadres").optional().nullable(),
  geboortedatum: z.string().optional().nullable().transform(val => val === "" ? null : val),
  opmerkingen: z.string().optional().nullable().transform(val => val === "" ? null : val),
});

export const insertTrajectorySchema = createInsertSchema(trajectories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  candidateId: z.number().min(1, "Kandidaat is verplicht"),
  clientId: z.number().min(1, "Opdrachtgever is verplicht"),
  startDate: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  hourlyRate: z.string().optional().nullable(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const upsertUserSchema = createInsertSchema(users);

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Types
export type Candidate = typeof candidates.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type ClientLocation = typeof clientLocations.$inferSelect;
export type ClientContact = typeof clientContacts.$inferSelect;
export type Trajectory = typeof trajectories.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type User = typeof users.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertClientLocation = z.infer<typeof insertClientLocationSchema>;
export type InsertClientContact = z.infer<typeof insertClientContactSchema>;
export type InsertTrajectory = z.infer<typeof insertTrajectorySchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Extended types with relations
export type CandidateWithRelations = Candidate & {
  trajectories?: Trajectory[];
  notes?: Note[];
  documents?: Document[];
};

export type TrajectoryWithRelations = Trajectory & {
  candidate?: Candidate;
  client?: Client;
  notes?: Note[];
  documents?: Document[];
};

export type ClientWithRelations = Client & {
  trajectories?: Trajectory[];
  notes?: Note[];
  documents?: Document[];
  locations?: ClientLocation[];
  contacts?: ClientContact[];
};
