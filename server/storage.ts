import {
  candidates,
  clients,
  trajectories,
  notes,
  documents,
  auditLog,
  users,
  adminUsers,
  type Candidate,
  type Client,
  type Trajectory,
  type Note,
  type Document,
  type InsertCandidate,
  type InsertClient,
  type InsertTrajectory,
  type InsertNote,
  type InsertDocument,
  type User,
  type UpsertUser,
  type AdminUser,
  type InsertAdminUser,
  type CandidateWithRelations,
  type TrajectoryWithRelations,
  type ClientWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Candidate operations
  getCandidates(filters?: {
    search?: string;
    status?: string[];
    region?: string;
    drivingLicenses?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CandidateWithRelations[]>;
  getCandidate(id: number): Promise<CandidateWithRelations | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: number): Promise<void>;

  // Client operations
  getClients(filters?: {
    search?: string;
    workType?: string;
  }): Promise<ClientWithRelations[]>;
  getClient(id: number): Promise<ClientWithRelations | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Trajectory operations
  getTrajectories(filters?: {
    search?: string;
    status?: string[];
    candidateId?: number;
    clientId?: number;
  }): Promise<TrajectoryWithRelations[]>;
  getTrajectory(id: number): Promise<TrajectoryWithRelations | undefined>;
  createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory>;
  updateTrajectory(id: number, trajectory: Partial<InsertTrajectory>): Promise<Trajectory>;
  deleteTrajectory(id: number): Promise<void>;

  // Notes operations
  getNotes(entityType: string, entityId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;

  // Documents operations
  getDocuments(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Audit operations
  logAudit(entityType: string, entityId: number, action: string, changes: any, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Candidate operations
  async getCandidates(filters?: {
    search?: string;
    status?: string[];
    region?: string;
    drivingLicenses?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CandidateWithRelations[]> {
    let query = db.select().from(candidates);
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(candidates.name, `%${filters.search}%`),
          ilike(candidates.email, `%${filters.search}%`),
          ilike(candidates.phone, `%${filters.search}%`),
          ilike(candidates.city, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status?.length) {
      conditions.push(eq(candidates.status, filters.status[0])); // Simplified for now
    }

    if (filters?.region) {
      conditions.push(eq(candidates.region, filters.region));
    }

    if (filters?.dateFrom) {
      conditions.push(eq(candidates.dateAdded, filters.dateFrom)); // Simplified
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const candidateResults = await query.orderBy(desc(candidates.createdAt));
    
    // Get related data for each candidate
    const candidatesWithRelations: CandidateWithRelations[] = [];
    for (const candidate of candidateResults) {
      const candidateTrajectories = await db
        .select()
        .from(trajectories)
        .where(eq(trajectories.candidateId, candidate.id));
      
      candidatesWithRelations.push({
        ...candidate,
        trajectories: candidateTrajectories,
      });
    }

    return candidatesWithRelations;
  }

  async getCandidate(id: number): Promise<CandidateWithRelations | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    if (!candidate) return undefined;

    const candidateTrajectories = await db
      .select()
      .from(trajectories)
      .where(eq(trajectories.candidateId, id));

    const candidateNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, "candidate"), eq(notes.entityId, id)))
      .orderBy(desc(notes.createdAt));

    const candidateDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "candidate"), eq(documents.entityId, id)));

    return {
      ...candidate,
      trajectories: candidateTrajectories,
      notes: candidateNotes,
      documents: candidateDocuments,
    };
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(candidates).values(candidate).returning();
    return newCandidate;
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ ...candidate, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  // Client operations
  async getClients(filters?: {
    search?: string;
    workType?: string;
  }): Promise<ClientWithRelations[]> {
    let query = db.select().from(clients);
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(clients.name, `%${filters.search}%`),
          ilike(clients.contactPerson, `%${filters.search}%`),
          ilike(clients.location, `%${filters.search}%`)
        )
      );
    }

    if (filters?.workType) {
      conditions.push(eq(clients.workType, filters.workType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const clientResults = await query.orderBy(desc(clients.createdAt));
    
    const clientsWithRelations: ClientWithRelations[] = [];
    for (const client of clientResults) {
      const clientTrajectories = await db
        .select()
        .from(trajectories)
        .where(eq(trajectories.clientId, client.id));
      
      clientsWithRelations.push({
        ...client,
        trajectories: clientTrajectories,
      });
    }

    return clientsWithRelations;
  }

  async getClient(id: number): Promise<ClientWithRelations | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;

    const clientTrajectories = await db
      .select()
      .from(trajectories)
      .where(eq(trajectories.clientId, id));

    const clientNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, "client"), eq(notes.entityId, id)))
      .orderBy(desc(notes.createdAt));

    const clientDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "client"), eq(documents.entityId, id)));

    return {
      ...client,
      trajectories: clientTrajectories,
      notes: clientNotes,
      documents: clientDocuments,
    };
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Trajectory operations
  async getTrajectories(filters?: {
    search?: string;
    status?: string[];
    candidateId?: number;
    clientId?: number;
  }): Promise<TrajectoryWithRelations[]> {
    let query = db.select().from(trajectories);
    const conditions = [];

    if (filters?.status?.length) {
      conditions.push(eq(trajectories.status, filters.status[0])); // Simplified
    }

    if (filters?.candidateId) {
      conditions.push(eq(trajectories.candidateId, filters.candidateId));
    }

    if (filters?.clientId) {
      conditions.push(eq(trajectories.clientId, filters.clientId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const trajectoryResults = await query.orderBy(desc(trajectories.createdAt));
    
    const trajectoriesWithRelations: TrajectoryWithRelations[] = [];
    for (const trajectory of trajectoryResults) {
      const candidate = trajectory.candidateId 
        ? await db.select().from(candidates).where(eq(candidates.id, trajectory.candidateId)).then(r => r[0])
        : undefined;
      
      const client = trajectory.clientId
        ? await db.select().from(clients).where(eq(clients.id, trajectory.clientId)).then(r => r[0])
        : undefined;
      
      trajectoriesWithRelations.push({
        ...trajectory,
        candidate,
        client,
      });
    }

    return trajectoriesWithRelations;
  }

  async getTrajectory(id: number): Promise<TrajectoryWithRelations | undefined> {
    const [trajectory] = await db.select().from(trajectories).where(eq(trajectories.id, id));
    if (!trajectory) return undefined;

    const candidate = trajectory.candidateId 
      ? await db.select().from(candidates).where(eq(candidates.id, trajectory.candidateId)).then(r => r[0])
      : undefined;
    
    const client = trajectory.clientId
      ? await db.select().from(clients).where(eq(clients.id, trajectory.clientId)).then(r => r[0])
      : undefined;

    const trajectoryNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, "trajectory"), eq(notes.entityId, id)))
      .orderBy(desc(notes.createdAt));

    const trajectoryDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "trajectory"), eq(documents.entityId, id)));

    return {
      ...trajectory,
      candidate,
      client,
      notes: trajectoryNotes,
      documents: trajectoryDocuments,
    };
  }

  async createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory> {
    const [newTrajectory] = await db.insert(trajectories).values(trajectory).returning();
    return newTrajectory;
  }

  async updateTrajectory(id: number, trajectory: Partial<InsertTrajectory>): Promise<Trajectory> {
    const [updatedTrajectory] = await db
      .update(trajectories)
      .set({ ...trajectory, updatedAt: new Date() })
      .where(eq(trajectories.id, id))
      .returning();
    return updatedTrajectory;
  }

  async deleteTrajectory(id: number): Promise<void> {
    await db.delete(trajectories).where(eq(trajectories.id, id));
  }

  // Notes operations
  async getNotes(entityType: string, entityId: number): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, entityType), eq(notes.entityId, entityId)))
      .orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  // Documents operations
  async getDocuments(entityType: string, entityId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, entityType), eq(documents.entityId, entityId)));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Audit operations
  async logAudit(entityType: string, entityId: number, action: string, changes: any, userId: string): Promise<void> {
    await db.insert(auditLog).values({
      entityType,
      entityId,
      action,
      changes,
      userId,
    });
  }
}

export const storage = new DatabaseStorage();
