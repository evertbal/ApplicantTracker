import {
  candidates,
  clients,
  clientLocations,
  clientContacts,
  clientAgreements,
  trajectories,
  notes,
  documents,
  auditLog,
  users,
  adminUsers,
  type Candidate,
  type Client,
  type ClientLocation,
  type ClientContact,
  type ClientAgreement,
  type Trajectory,
  type Note,
  type Document,
  type InsertCandidate,
  type InsertClient,
  type InsertClientLocation,
  type InsertClientContact,
  type InsertClientAgreement,
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
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUserActiveStatus(id: string, isActive: boolean): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  approveUser(id: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;

  // Admin user operations
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  getAdminUserById(id: number): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser>;
  updateAdminUserLastLogin(id: number): Promise<void>;
  deactivateAdminUser(id: number): Promise<AdminUser>;

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
  updateCandidate(id: number, candidate: Partial<InsertCandidate>, updatedBy?: string): Promise<Candidate>;
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

  // Client location operations
  getClientLocations(clientId: number): Promise<ClientLocation[]>;
  createClientLocation(location: InsertClientLocation): Promise<ClientLocation>;
  updateClientLocation(id: number, location: Partial<InsertClientLocation>): Promise<ClientLocation>;
  deleteClientLocation(id: number): Promise<void>;

  // Client contact operations
  getClientContacts(clientId: number): Promise<ClientContact[]>;
  createClientContact(contact: InsertClientContact): Promise<ClientContact>;
  updateClientContact(id: number, contact: Partial<InsertClientContact>): Promise<ClientContact>;
  deleteClientContact(id: number): Promise<void>;

  // Client agreement operations
  getClientAgreements(clientId: number): Promise<ClientAgreement[]>;
  createClientAgreement(agreement: InsertClientAgreement): Promise<ClientAgreement>;
  updateClientAgreement(id: number, agreement: Partial<InsertClientAgreement>): Promise<ClientAgreement>;
  deleteClientAgreement(id: number): Promise<void>;

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
  updateNote(id: number, content: string): Promise<Note>;
  deleteNote(id: number): Promise<void>;

  // Documents operations
  getDocuments(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  // Audit operations
  logAudit(entityType: string, entityId: number, action: string, changes: any, userId: string): Promise<void>;

  getCandidateByEmail(email: string): Promise<Candidate | null>;
  getCandidateByName(name: string): Promise<Candidate | null>;
  getCandidateByNameAndPhone(name: string, phone: string): Promise<Candidate | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
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

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserActiveStatus(id: string, isActive: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.createdAt));
  }

  async approveUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isPending: false, isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isPending, true)).orderBy(asc(users.createdAt));
  }

  // Admin user operations
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminUserById(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(adminUser).returning();
    return user;
  }

  async updateAdminUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser> {
    const [user] = await db
      .update(adminUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return user;
  }

  async updateAdminUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  async deactivateAdminUser(id: number): Promise<AdminUser> {
    const [user] = await db
      .update(adminUsers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
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
    let query = db
      .select({
        candidates,
        addedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.addedBy, users.id));

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
      query = query.where(and(...conditions)) as any;
    }

    const candidateResults = await query.orderBy(desc(candidates.createdAt));

    // Return candidates without relations for performance - relations can be loaded on detail page
    return candidateResults.map(result => ({
      ...result.candidates,
      addedByUser: result.addedByUser,
      trajectories: [],
      notes: [],
      documents: []
    }));
  }

  async getCandidate(id: number): Promise<CandidateWithRelations | undefined> {
    const [result] = await db
      .select({
        candidates,
        addedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(candidates)
      .leftJoin(users, eq(candidates.addedBy, users.id))
      .where(eq(candidates.id, id));

    // Get updated by user information separately
    let updatedByUser = null;
    if (result && result.candidates.updatedBy) {
      const [updatedBy] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, result.candidates.updatedBy));
      updatedByUser = updatedBy;
    }

    if (!result) return undefined;

    const candidate = { ...result.candidates, addedByUser: result.addedByUser, updatedByUser };

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

  async getCandidateByEmail(email: string): Promise<Candidate | null> {
    try {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.email, email))
        .limit(1);
      return candidate || null;
    } catch (error) {
      console.error("Error getting candidate by email:", error);
      return null;
    }
  }

  async getCandidateByName(name: string): Promise<Candidate | null> {
    try {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.name, name))
        .limit(1);
      return candidate || null;
    } catch (error) {
      console.error("Error getting candidate by name:", error);
      return null;
    }
  }

  async getCandidateByNameAndPhone(name: string, phone: string): Promise<Candidate | null> {
    try {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(and(
          eq(candidates.name, name),
          eq(candidates.phone, phone)
        ))
        .limit(1);
      return candidate || null;
    } catch (error) {
      console.error("Error getting candidate by name and phone:", error);
      return null;
    }
  }

  async createCandidate(candidateData: InsertCandidate): Promise<Candidate> {
    try {
      const [candidate] = await db.insert(candidates).values(candidateData).returning();
      return candidate;
    } catch (error) {
      console.error("Error creating candidate:", error);
      throw new Error("Failed to create candidate");
    }
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>, updatedBy?: string): Promise<Candidate> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ ...candidate, updatedAt: new Date(), updatedBy })
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
      query = query.where(and(...conditions)) as any;
    }

    const clientResults = await query.orderBy(desc(clients.createdAt));

    // Load contacts for each client to ensure they're visible in the UI
    const clientsWithContacts = await Promise.all(
      clientResults.map(async (client) => {
        const contacts = await db.select().from(clientContacts)
          .where(eq(clientContacts.clientId, client.id))
          .orderBy(desc(clientContacts.createdAt));

        return {
          ...client,
          trajectories: [],
          notes: [],
          documents: [],
          locations: [],
          contacts: contacts,
        };
      })
    );

    return clientsWithContacts;
  }

  async getClient(id: number): Promise<ClientWithRelations | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    if (!client) return undefined;

    const [clientTrajectories, clientNotes, clientDocuments, locations, contacts] = await Promise.all([
      db.select().from(trajectories).where(eq(trajectories.clientId, id)),
      db.select().from(notes).where(and(eq(notes.entityType, "client"), eq(notes.entityId, id))).orderBy(desc(notes.createdAt)),
      db.select().from(documents).where(and(eq(documents.entityType, "client"), eq(documents.entityId, id))),
      db.select().from(clientLocations).where(eq(clientLocations.clientId, id)).orderBy(desc(clientLocations.createdAt)),
      db.select().from(clientContacts).where(eq(clientContacts.clientId, id)).orderBy(desc(clientContacts.createdAt))
    ]);

    return {
      ...client,
      trajectories: clientTrajectories,
      notes: clientNotes,
      documents: clientDocuments,
      locations: locations,
      contacts: contacts,
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

  // Client location operations
  async getClientLocations(clientId: number): Promise<ClientLocation[]> {
    return db.select().from(clientLocations).where(eq(clientLocations.clientId, clientId)).orderBy(desc(clientLocations.createdAt));
  }

  async createClientLocation(location: InsertClientLocation): Promise<ClientLocation> {
    const [newLocation] = await db.insert(clientLocations).values(location).returning();
    return newLocation;
  }

  async updateClientLocation(id: number, location: Partial<InsertClientLocation>): Promise<ClientLocation> {
    const [updatedLocation] = await db
      .update(clientLocations)
      .set({ ...location, updatedAt: new Date() })
      .where(eq(clientLocations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteClientLocation(id: number): Promise<void> {
    await db.delete(clientLocations).where(eq(clientLocations.id, id));
  }

  // Client contact operations
  async getClientContacts(clientId: number): Promise<ClientContact[]> {
    return db.select().from(clientContacts).where(eq(clientContacts.clientId, clientId)).orderBy(desc(clientContacts.createdAt));
  }

  async createClientContact(contact: InsertClientContact): Promise<ClientContact> {
    const [newContact] = await db.insert(clientContacts).values(contact).returning();
    return newContact;
  }

  async updateClientContact(id: number, contact: Partial<InsertClientContact>): Promise<ClientContact> {
    const [updatedContact] = await db
      .update(clientContacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(clientContacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteClientContact(id: number): Promise<void> {
    await db.delete(clientContacts).where(eq(clientContacts.id, id));
  }

  // Client agreement operations
  async getClientAgreements(clientId: number): Promise<ClientAgreement[]> {
    return db.select().from(clientAgreements).where(eq(clientAgreements.clientId, clientId)).orderBy(desc(clientAgreements.createdAt));
  }

  async createClientAgreement(agreement: InsertClientAgreement): Promise<ClientAgreement> {
    const [newAgreement] = await db.insert(clientAgreements).values(agreement).returning();
    return newAgreement;
  }

  async updateClientAgreement(id: number, agreement: Partial<InsertClientAgreement>): Promise<ClientAgreement> {
    const [updatedAgreement] = await db
      .update(clientAgreements)
      .set({ ...agreement, updatedAt: new Date() })
      .where(eq(clientAgreements.id, id))
      .returning();
    return updatedAgreement;
  }

  async deleteClientAgreement(id: number): Promise<void> {
    await db.delete(clientAgreements).where(eq(clientAgreements.id, id));
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
      query = query.where(and(...conditions)) as any;
    }

    const trajectoryResults = await query.orderBy(desc(trajectories.createdAt));

    // Load candidate and client relations for each trajectory
    const trajectoriesWithRelations: TrajectoryWithRelations[] = await Promise.all(
      trajectoryResults.map(async (trajectory) => {
        const candidate = trajectory.candidateId 
          ? await db.select().from(candidates).where(eq(candidates.id, trajectory.candidateId)).then(r => r[0])
          : undefined;

        const client = trajectory.clientId
          ? await db.select().from(clients).where(eq(clients.id, trajectory.clientId)).then(r => r[0])
          : undefined;

        return {
          ...trajectory,
          candidate,
          client,
          notes: [],
          documents: []
        };
      })
    );

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
    } as TrajectoryWithRelations;
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

  async updateNote(id: number, content: string): Promise<Note> {
    const [updatedNote] = await db
      .update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
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