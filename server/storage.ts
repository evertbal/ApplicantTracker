import {
  users,
  candidates,
  clients,
  trajectories,
  notes,
  documents,
  auditLogs,
  type User,
  type UpsertUser,
  type Candidate,
  type InsertCandidate,
  type CandidateWithRelations,
  type Client,
  type InsertClient,
  type ClientWithRelations,
  type Trajectory,
  type InsertTrajectory,
  type TrajectoryWithRelations,
  type Note,
  type InsertNote,
  type Document,
  type InsertDocument,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, asc, or, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Candidate operations
  getCandidates(filters?: {
    search?: string;
    status?: string[];
    region?: string;
    drivingLicense?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<CandidateWithRelations[]>;
  getCandidate(id: number): Promise<CandidateWithRelations | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: number): Promise<void>;

  // Client operations
  getClients(filters?: {
    search?: string;
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

  // Note operations
  getNotes(entityType: string, entityId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;

  // Document operations
  getDocuments(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Audit operations
  logAudit(userId: string, action: string, entityType: string, entityId: number, oldValues?: any, newValues?: any): Promise<void>;
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
    drivingLicense?: string[];
    dateFrom?: string;
    dateTo?: string;
  }): Promise<CandidateWithRelations[]> {
    let query = db.select().from(candidates);
    
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(candidates.name, `%${filters.search}%`),
          like(candidates.email, `%${filters.search}%`),
          like(candidates.phone, `%${filters.search}%`),
          like(candidates.city, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.status && filters.status.length > 0) {
      conditions.push(inArray(candidates.status, filters.status));
    }
    
    if (filters?.region) {
      conditions.push(eq(candidates.region, filters.region));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(candidates.createdAt));
    return result as CandidateWithRelations[];
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
      .orderBy(desc(notes.timestamp));

    const candidateDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "candidate"), eq(documents.entityId, id)))
      .orderBy(desc(documents.uploadedAt));

    return {
      ...candidate,
      trajectories: candidateTrajectories,
      notes: candidateNotes,
      documents: candidateDocuments,
    };
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db
      .insert(candidates)
      .values(candidate)
      .returning();
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
  async getClients(filters?: { search?: string }): Promise<ClientWithRelations[]> {
    let query = db.select().from(clients);
    
    if (filters?.search) {
      query = query.where(
        or(
          like(clients.name, `%${filters.search}%`),
          like(clients.contactPerson, `%${filters.search}%`),
          like(clients.location, `%${filters.search}%`)
        )
      );
    }
    
    const result = await query.orderBy(asc(clients.name));
    return result as ClientWithRelations[];
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
      .orderBy(desc(notes.timestamp));

    const clientDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "client"), eq(documents.entityId, id)))
      .orderBy(desc(documents.uploadedAt));

    return {
      ...client,
      trajectories: clientTrajectories,
      notes: clientNotes,
      documents: clientDocuments,
    };
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
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
    let query = db
      .select({
        trajectory: trajectories,
        candidate: candidates,
        client: clients,
      })
      .from(trajectories)
      .leftJoin(candidates, eq(trajectories.candidateId, candidates.id))
      .leftJoin(clients, eq(trajectories.clientId, clients.id));
    
    const conditions = [];
    
    if (filters?.candidateId) {
      conditions.push(eq(trajectories.candidateId, filters.candidateId));
    }
    
    if (filters?.clientId) {
      conditions.push(eq(trajectories.clientId, filters.clientId));
    }
    
    if (filters?.status && filters.status.length > 0) {
      conditions.push(inArray(trajectories.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(desc(trajectories.createdAt));
    
    return result.map(row => ({
      ...row.trajectory,
      candidate: row.candidate,
      client: row.client,
    })) as TrajectoryWithRelations[];
  }

  async getTrajectory(id: number): Promise<TrajectoryWithRelations | undefined> {
    const [result] = await db
      .select({
        trajectory: trajectories,
        candidate: candidates,
        client: clients,
      })
      .from(trajectories)
      .leftJoin(candidates, eq(trajectories.candidateId, candidates.id))
      .leftJoin(clients, eq(trajectories.clientId, clients.id))
      .where(eq(trajectories.id, id));

    if (!result) return undefined;

    const trajectoryNotes = await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, "trajectory"), eq(notes.entityId, id)))
      .orderBy(desc(notes.timestamp));

    const trajectoryDocuments = await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, "trajectory"), eq(documents.entityId, id)))
      .orderBy(desc(documents.uploadedAt));

    return {
      ...result.trajectory,
      candidate: result.candidate,
      client: result.client,
      notes: trajectoryNotes,
      documents: trajectoryDocuments,
    };
  }

  async createTrajectory(trajectory: InsertTrajectory): Promise<Trajectory> {
    const [newTrajectory] = await db
      .insert(trajectories)
      .values(trajectory)
      .returning();
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

  // Note operations
  async getNotes(entityType: string, entityId: number): Promise<Note[]> {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.entityType, entityType), eq(notes.entityId, entityId)))
      .orderBy(desc(notes.timestamp));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db
      .insert(notes)
      .values(note)
      .returning();
    return newNote;
  }

  // Document operations
  async getDocuments(entityType: string, entityId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.entityType, entityType), eq(documents.entityId, entityId)))
      .orderBy(desc(documents.uploadedAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Audit operations
  async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: number,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
    });
  }
}

export const storage = new DatabaseStorage();
