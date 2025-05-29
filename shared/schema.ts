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
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  dateAdded: timestamp("date_added").defaultNow(),
  name: text("name").notNull(),
  description: text("description"),
  drivingLicense: text("driving_license").array(),
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

// Clients (Opdrachtgevers) table
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
  position: text("position"),
  rate: text("rate"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // candidate, trajectory, client
  entityId: integer("entity_id").notNull(),
  text: text("text").notNull(),
  authorId: varchar("author_id").references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
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

// Audit trail table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // create, update, delete
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  timestamp: timestamp("timestamp").defaultNow(),
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

// Zod schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  dateAdded: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrajectorySchema = createInsertSchema(trajectories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Trajectory = typeof trajectories.$inferSelect;
export type InsertTrajectory = z.infer<typeof insertTrajectorySchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

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
