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
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("viewer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
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
  email: z.string().email("Ongeldig e-mailadres").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  workType: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
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
export type Trajectory = typeof trajectories.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type User = typeof users.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
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
};
