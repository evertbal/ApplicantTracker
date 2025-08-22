import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { candidates, trajectories } from "@shared/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";
import session from "express-session";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  authenticateAdmin, 
  requireRole, 
  requirePermission, 
  hashPassword, 
  verifyPassword, 
  generateToken,
  verifyToken,
  type AdminAuthRequest 
} from "./adminAuth";
import { insertAdminUserSchema, upsertUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { 
  insertCandidateSchema, 
  insertClientSchema,
  insertClientLocationSchema,
  insertClientContactSchema,
  insertClientAgreementSchema,
  insertTrajectorySchema,
  insertNoteSchema,
  insertDocumentSchema
} from "@shared/schema";
import { normalizeDrivingLicense, batchNormalizeDrivingLicenses } from "./driverLicenseNormalizer";
import bcrypt from 'bcryptjs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Multer configuration for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Alleen Excel (.xlsx, .xls) en CSV bestanden zijn toegestaan'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Document upload multer configuration
  const documentUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'text/plain'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Bestandstype niet toegestaan. Ondersteunde typen: PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG, GIF, TXT'));
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Enable Replit Auth alongside simple auth
  await setupAuth(app);

  // Session configuration for simple auth
  const sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-key-for-development';
  
  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Registration schema
  const registerSchema = z.object({
    email: z.string().email("Ongeldig email adres").refine(
      (email) => email.endsWith("@doenersingroen.nl"),
      "Alleen @doenersingroen.nl email adressen zijn toegestaan"
    ),
    firstName: z.string().min(1, "Voornaam is verplicht"),
    lastName: z.string().min(1, "Achternaam is verplicht"),
    password: z.string().min(8, "Wachtwoord moet minimaal 8 karakters zijn")
  });

  const loginSchema = z.object({
    email: z.string().email("Ongeldig email adres"),
    password: z.string().min(1, "Wachtwoord is verplicht")
  });

  // Simple session-based auth middleware
  const authenticateUser = (req: any, res: any, next: any) => {
    if (req.session?.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes - simplified login/register system
  app.get('/api/auth/user', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Gebruikersnaam en wachtwoord zijn vereist' });
      }

      const adminUser = await storage.getAdminUser(username);
      if (!adminUser || !adminUser.isActive) {
        return res.status(401).json({ message: 'Ongeldige inloggegevens' });
      }

      const isValidPassword = await verifyPassword(password, adminUser.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Ongeldige inloggegevens' });
      }

      // Update last login
      await storage.updateAdminUserLastLogin(adminUser.id);

      const token = generateToken({
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      });

      res.json({
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Server fout' });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Fout bij ophalen gebruikers' });
    }
  });

  app.get('/api/admin/admin-users', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const adminUsers = await storage.getAllAdminUsers();
      // Remove password hashes from response
      const safeAdminUsers = adminUsers.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeAdminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      res.status(500).json({ message: 'Fout bij ophalen admin gebruikers' });
    }
  });

  app.post('/api/admin/admin-users', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const validatedData = insertAdminUserSchema.parse(req.body);
      
      // Hash the password
      const passwordHash = await hashPassword(validatedData.passwordHash);
      
      const adminUser = await storage.createAdminUser({
        ...validatedData,
        passwordHash
      });

      // Remove password hash from response
      const { passwordHash: _, ...safeUser } = adminUser;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Fout bij aanmaken admin gebruiker' });
    }
  });

  app.patch('/api/admin/users/:id/role', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      if (!['admin', 'recruiter', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Ongeldige rol' });
      }

      const user = await storage.updateUserRole(id, role);
      res.json(user);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Fout bij bijwerken gebruikersrol' });
    }
  });

  app.patch('/api/admin/users/:id/status', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const user = await storage.updateUserActiveStatus(id, isActive);
      res.json(user);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Fout bij bijwerken gebruikersstatus' });
    }
  });

  app.patch('/api/admin/admin-users/:id', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // If password is being updated, hash it
      if (updates.passwordHash) {
        updates.passwordHash = await hashPassword(updates.passwordHash);
      }

      const adminUser = await storage.updateAdminUser(parseInt(id), updates);
      
      // Remove password hash from response
      const { passwordHash: _, ...safeUser } = adminUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Error updating admin user:', error);
      res.status(500).json({ message: 'Fout bij bijwerken admin gebruiker' });
    }
  });

  app.delete('/api/admin/admin-users/:id', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const adminUser = await storage.deactivateAdminUser(parseInt(id));
      
      // Remove password hash from response
      const { passwordHash: _, ...safeUser } = adminUser;
      res.json(safeUser);
    } catch (error) {
      console.error('Error deactivating admin user:', error);
      res.status(500).json({ message: 'Fout bij deactiveren admin gebruiker' });
    }
  });

  // Pending user approval routes
  app.get('/api/admin/pending-users', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      res.status(500).json({ message: 'Fout bij ophalen pending gebruikers' });
    }
  });

  app.post('/api/admin/approve-user/:id', authenticateAdmin, requireRole('admin'), async (req: AdminAuthRequest, res) => {
    try {
      const userId = req.params.id;
      const approvedUser = await storage.approveUser(userId);
      res.json({ message: 'Gebruiker goedgekeurd', user: approvedUser });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ message: 'Fout bij goedkeuren gebruiker' });
    }
  });

  // User login endpoint
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Gebruikersnaam en wachtwoord zijn vereist' });
      }

      // Try to find user by username or email
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.getUserByEmail(username);
      }

      if (!user) {
        return res.status(401).json({ message: 'Ongeldige inloggegevens' });
      }

      if (user.isPending) {
        return res.status(401).json({ message: 'Account wacht nog op goedkeuring van een admin' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is gedeactiveerd' });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Ongeldige inloggegevens' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: 'Ongeldige inloggegevens' });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session
      req.session.userId = user.id;

      res.json({ 
        message: 'Succesvol ingelogd', 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server fout' });
    }
  });

  // User registration endpoint
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Alle velden zijn verplicht' });
      }

      // Validate email domain
      if (!email.endsWith('@doenersingroen.nl')) {
        return res.status(400).json({ message: 'Alleen @doenersingroen.nl email adressen zijn toegestaan' });
      }

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email is al in gebruik' });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'Gebruikersnaam is al in gebruik' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user (pending approval)
      const userId = username + '-' + Date.now();
      await storage.upsertUser({
        id: userId,
        username,
        email,
        passwordHash,
        role: 'viewer',
        isActive: false,
        isPending: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.json({ 
        message: 'Account aangemaakt. Wacht op goedkeuring van een admin.',
        requiresApproval: true
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server fout' });
    }
  });

  // /api/login is now handled by Replit Auth in setupAuth()

  // Logout endpoint
  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Enhanced authentication middleware that supports multiple auth methods
  const authenticateAny: any = async (req: any, res: any, next: any) => {
    // Method 1: Try admin token authentication
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (adminToken) {
      try {
        const decoded = verifyToken(adminToken);
        req.adminUser = decoded;
        req.user = { id: decoded.id, email: decoded.username };
        return next();
      } catch (error) {
        // Admin token invalid, continue to try other methods
      }
    }

    // Method 2: Try Replit authentication first (most common case)
    if (req.isAuthenticated && req.isAuthenticated()) {
      // Ensure we have a user object from Replit auth
      if (req.user) {
        return next();
      }
    }

    // Method 3: Try session-based user authentication
    if (req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user && user.isActive) {  
          req.user = user;
          return next();
        }
      } catch (error) {
        // Session auth failed, continue to try other methods
      }
    }

    // No valid authentication found
    console.log('Authentication failed - no valid method found');
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Reports routes
  app.get('/api/reports/quarterly-kpi', authenticateAny, async (req, res) => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-based (0 = January, 6 = July)
      
      // Determine which quarter is the latest completed one
      let latestQuarter: number;
      if (currentMonth >= 6) { // July or later - Q2 is latest completed
        latestQuarter = 2;
      } else if (currentMonth >= 3) { // April-June - Q1 is latest completed
        latestQuarter = 1;
      } else { // January-March - Q4 of previous year is latest completed
        latestQuarter = 4;
      }
      
      // Calculate Q1 and Q2 date ranges as ISO strings
      const q1Start = `${currentYear}-01-01T00:00:00.000Z`; // January 1
      const q1End = `${currentYear}-03-31T23:59:59.999Z`; // March 31
      const q2Start = `${currentYear}-04-01T00:00:00.000Z`; // April 1
      const q2End = `${currentYear}-06-30T23:59:59.999Z`; // June 30
      
      // Get Q1 and Q2 data for candidates added
      const q1CandidatesResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM candidates 
        WHERE date_added >= ${q1Start} AND date_added <= ${q1End}
      `);
      
      const q2CandidatesResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM candidates 
        WHERE date_added >= ${q2Start} AND date_added <= ${q2End}
      `);
      
      // Get Q1 and Q2 data for trajectories created
      const q1TrajectoriesResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM trajectories 
        WHERE created_at >= ${q1Start} AND created_at <= ${q1End}
      `);
      
      const q2TrajectoriesResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM trajectories 
        WHERE created_at >= ${q2Start} AND created_at <= ${q2End}
      `);
      
      // Get Q1 and Q2 data for candidates proposed (status = 'voorgesteld aan klant')
      const q1ProposedResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM trajectories 
        WHERE status = 'voorgesteld aan klant' 
        AND updated_at >= ${q1Start} AND updated_at <= ${q1End}
      `);
      
      const q2ProposedResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM trajectories 
        WHERE status = 'voorgesteld aan klant' 
        AND updated_at >= ${q2Start} AND updated_at <= ${q2End}
      `);
      
      // Extract counts and convert to numbers
      const q1Candidates = Number(q1CandidatesResult.rows[0]?.count || 0);
      const q2Candidates = Number(q2CandidatesResult.rows[0]?.count || 0);
      const q1Trajectories = Number(q1TrajectoriesResult.rows[0]?.count || 0);
      const q2Trajectories = Number(q2TrajectoriesResult.rows[0]?.count || 0);
      const q1Proposed = Number(q1ProposedResult.rows[0]?.count || 0);
      const q2Proposed = Number(q2ProposedResult.rows[0]?.count || 0);
      
      // Calculate changes and percentages - latest quarter compared to previous quarter
      // Since we're in Q3 (July), Q2 is latest completed, Q1 is previous
      const candidatesChange = q2Candidates - q1Candidates;
      const candidatesChangePercentage = q1Candidates > 0 ? (candidatesChange / q1Candidates) * 100 : 0;
      
      const trajectoriesChange = q2Trajectories - q1Trajectories;
      const trajectoriesChangePercentage = q1Trajectories > 0 ? (trajectoriesChange / q1Trajectories) * 100 : 0;
      
      const proposedChange = q2Proposed - q1Proposed;
      const proposedChangePercentage = q1Proposed > 0 ? (proposedChange / q1Proposed) * 100 : 0;
      
      const kpiData = {
        candidatesAdded: {
          current: q2Candidates, // Latest quarter (Q2) in big numbers
          previous: q1Candidates, // Previous quarter (Q1) for comparison
          change: candidatesChange,
          changePercentage: candidatesChangePercentage
        },
        trajectoriesCreated: {
          current: q2Trajectories, // Latest quarter (Q2) in big numbers
          previous: q1Trajectories, // Previous quarter (Q1) for comparison
          change: trajectoriesChange,
          changePercentage: trajectoriesChangePercentage
        },
        candidatesProposed: {
          current: q2Proposed, // Latest quarter (Q2) in big numbers
          previous: q1Proposed, // Previous quarter (Q1) for comparison
          change: proposedChange,
          changePercentage: proposedChangePercentage
        }
      };
      
      res.json(kpiData);
    } catch (error) {
      console.error('Error fetching quarterly KPI data:', error);
      res.status(500).json({ message: 'Failed to fetch quarterly KPI data' });
    }
  });

  // Candidate routes
  app.get("/api/candidates", authenticateAny, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        region: req.query.region as string,
        drivingLicenses: req.query.drivingLicenses ? (req.query.drivingLicenses as string).split(',') : undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      };
      
      const candidates = await storage.getCandidates(filters);
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.get("/api/candidates/:id", authenticateAny, async (req, res) => {
    try {
      const { id } = req.params;
      const candidate = await storage.getCandidate(parseInt(id));
      
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      res.json(candidate);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });



  app.post("/api/candidates", authenticateAny, async (req: any, res) => {
    try {
      const { trajectories, notes, ...candidateData } = req.body;
      const validatedCandidateData = insertCandidateSchema.parse(candidateData);
      
      // Check for duplicate email
      if (validatedCandidateData.email) {
        const existingByEmail = await storage.getCandidateByEmail(validatedCandidateData.email);
        if (existingByEmail) {
          return res.status(400).json({
            message: "Een kandidaat met dit emailadres bestaat al",
            duplicate: existingByEmail
          });
        }
      }

      // Always check for duplicate name
      const existingByName = await storage.getCandidateByName(validatedCandidateData.name);
      if (existingByName) {
        return res.status(400).json({
          message: "Een kandidaat met deze naam bestaat al",
          duplicate: existingByName
        });
      }
      
      // Normaliseer rijbewijs data als aanwezig
      if (validatedCandidateData.drivingLicenses && validatedCandidateData.drivingLicenses.length > 0) {
        const rawLicenseString = validatedCandidateData.drivingLicenses.join(', ');
        const normalized = normalizeDrivingLicense(rawLicenseString);
        validatedCandidateData.drivingLicenses = normalized.licenses;
      }
      
      // Voeg de huidige gebruiker toe als degene die de kandidaat heeft toegevoegd
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      validatedCandidateData.addedBy = userId;
      
      const candidate = await storage.createCandidate(validatedCandidateData);
      
      // Log audit voor kandidaat
      await storage.logAudit("candidate", candidate.id, "create", validatedCandidateData, userId);
      
      // Voeg trajecten toe als deze zijn opgegeven
      if (trajectories && Array.isArray(trajectories) && trajectories.length > 0) {
        for (const trajectoryData of trajectories) {
          try {
            const validatedTrajectoryData = insertTrajectorySchema.parse({
              ...trajectoryData,
              candidateId: candidate.id
            });
            
            const trajectory = await storage.createTrajectory(validatedTrajectoryData);
            await storage.logAudit("trajectory", trajectory.id, "create", validatedTrajectoryData, userId);
          } catch (trajectoryError) {
            console.error("Error creating trajectory:", trajectoryError);
            // Continue met andere trajecten, log de fout maar fail niet de hele operatie
          }
        }
      }
      
      // Voeg initiële notities toe als deze zijn opgegeven
      if (notes && Array.isArray(notes) && notes.length > 0) {
        for (const note of notes) {
          if (note.content && note.content.trim()) {
            try {
              await storage.createNote({
                entityType: "candidate",
                entityId: candidate.id,
                content: note.content.trim(),
                authorId: userId
              });
            } catch (noteError) {
              console.error("Error creating note:", noteError);
              // Continue met andere notities
            }
          }
        }
      }
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating candidate:", error);
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  app.put("/api/candidates/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidateData = insertCandidateSchema.partial().parse(req.body);
      
      // Normaliseer rijbewijs data als aanwezig
      if (candidateData.drivingLicenses && candidateData.drivingLicenses.length > 0) {
        const rawLicenseString = candidateData.drivingLicenses.join(', ');
        const normalized = normalizeDrivingLicense(rawLicenseString);
        candidateData.drivingLicenses = normalized.licenses;
      }
      
      // Get current user ID for tracking who updated the candidate
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      
      const candidate = await storage.updateCandidate(id, candidateData, userId);
      
      // Log audit
      await storage.logAudit("candidate", id, "update", candidateData, userId);
      
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating candidate:", error);
      res.status(500).json({ message: "Failed to update candidate" });
    }
  });

  app.delete("/api/candidates/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCandidate(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("candidate", id, "delete", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Excel import route for candidates
  app.post("/api/candidates/import", authenticateAny, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Geen bestand geüpload" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get all data as array of arrays first to handle custom headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Find the header row (look for row with "Naam" in it)
      let headerRowIndex = -1;
      let headers: string[] = [];
      
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i] as any[];
        if (row && row.some(cell => cell && String(cell).includes('Naam'))) {
          headerRowIndex = i;
          headers = row.map(cell => String(cell || '').trim());
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        return res.status(400).json({ message: "Geen geldige header rij gevonden. Zorg ervoor dat de header 'Naam' bevat." });
      }
      
      // Convert to objects using the found headers
      const data = rawData.slice(headerRowIndex + 1).map(row => {
        const obj: any = {};
        const rowArray = row as any[];
        headers.forEach((header, index) => {
          if (header && rowArray[index] !== undefined) {
            obj[header] = rowArray[index];
          }
        });
        return obj;
      }).filter(row => Object.keys(row).length > 0);

      let importedCount = 0;
      const errors: string[] = [];

      for (let index = 0; index < data.length; index++) {
        const row = data[index];
        try {
          const rowData = row as any;
          
          // Skip empty rows
          if (!rowData || Object.keys(rowData).length === 0) {
            continue;
          }
          
          // Map Excel columns to candidate fields
          const candidateData = {
            name: String(rowData.Naam || rowData.naam || rowData.Name || rowData.NAAM || '').trim(),
            email: String(rowData.Mailadres || rowData.email || rowData.Email || rowData.EMAIL || '').trim() || null,
            phone: String(rowData.Telefoonnummer || rowData.telefoon || rowData.Phone || rowData.TELEFOON || '').trim() || null,
            city: String(rowData.Woonplaats || rowData.stad || rowData.City || rowData.STAD || '').trim() || null,
            region: String(rowData.Regio || rowData.regio || rowData.Region || rowData.REGIO || '').trim() || null,
            status: String(rowData.Status || rowData.status || rowData.STATUS || 'active').trim(),
            drivingLicenses: (() => {
              const rawLicense = rowData.Rijbewijs || rowData.rijbewijs || rowData['Rijbewijs type'] || rowData['Rijbewijzen'] || '';
              if (!rawLicense) return [];
              
              // Normaliseer de rijbewijs invoer
              const normalized = normalizeDrivingLicense(String(rawLicense));
              return normalized.licenses;
            })(),
            description: String(rowData.Beschrijving || rowData.beschrijving || rowData.Description || rowData.BESCHRIJVING || '').trim() || null,
            marketing: String(rowData.Marketing || rowData.marketing || rowData.MARKETING || '').trim() || null,
            phase: String(rowData.fase || rowData.Phase || rowData.FASE || '').trim() || null
          };

          // Validate required fields
          if (!candidateData.name || candidateData.name === '') {
            errors.push(`Rij ${index + 2}: Naam is verplicht`);
            continue;
          }

          // Check for duplicates before creating
          if (candidateData.email) {
            const existingByEmail = await storage.getCandidateByEmail(candidateData.email);
            if (existingByEmail) {
              errors.push(`Rij ${index + 2}: Email '${candidateData.email}' bestaat al (Kandidaat: ${existingByEmail.name})`);
              continue;
            }
          }

          const existingByName = await storage.getCandidateByName(candidateData.name);
          if (existingByName) {
            errors.push(`Rij ${index + 2}: Kandidaat '${candidateData.name}' bestaat al`);
            continue;
          }

          // Validate and create candidate
          const validatedData = insertCandidateSchema.parse(candidateData);
          
          // Add the current user as the one who imported the candidate
          const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
          validatedData.addedBy = userId;
          
          const candidate = await storage.createCandidate(validatedData);
          
          // Log audit
          await storage.logAudit("candidate", candidate.id, "import", candidateData, userId);
          
          importedCount++;
        } catch (error) {
          console.error(`Error importing row ${index + 2}:`, error);
          errors.push(`Rij ${index + 2}: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
        }
      }

      res.json({
        imported: importedCount,
        total: data.length,
        errors: errors,
        debug: {
          firstRowData: data[0],
          sampleKeys: data[0] ? Object.keys(data[0]) : []
        }
      });

    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({ message: "Fout bij het importeren van het Excel bestand" });
    }
  });

  // Normaliseer alle bestaande kandidaat rijbewijzen
  app.post("/api/normalize-all-licenses", authenticateAny, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      let updatedCount = 0;
      let totalProcessed = 0;
      
      for (const candidate of candidates) {
        totalProcessed++;
        
        // Controleer of er rijbewijs data is die genormaliseerd moet worden
        if (candidate.drivingLicenses && candidate.drivingLicenses.length > 0) {
          // Voeg alle rijbewijs strings samen voor normalisatie
          const rawLicenseString = candidate.drivingLicenses.join(', ');
          const normalized = normalizeDrivingLicense(rawLicenseString);
          
          // Update alleen als er daadwerkelijk veranderingen zijn
          if (JSON.stringify(normalized.licenses) !== JSON.stringify(candidate.drivingLicenses)) {
            await storage.updateCandidate(candidate.id, {
              drivingLicenses: normalized.licenses
            });
            updatedCount++;
            
            // Log de normalisatie actie
            await storage.logAudit("candidate", candidate.id, "normalize_licenses", {
              original: candidate.drivingLicenses,
              normalized: normalized.licenses,
              heeft_geen_geldig_rijbewijs: normalized.heeft_geen_geldig_rijbewijs
            }, (req as any).user?.claims?.sub || 'system');
          }
        }
      }
      
      res.json({
        success: true,
        totalProcessed,
        updatedCount,
        message: `${updatedCount} van ${totalProcessed} kandidaten bijgewerkt met genormaliseerde rijbewijs data`
      });
    } catch (error) {
      console.error("Error normalizing all licenses:", error);
      res.status(500).json({ message: "Fout bij het normaliseren van alle rijbewijzen" });
    }
  });

  // Client routes
  app.get("/api/clients", authenticateAny, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        workType: req.query.workType as string,
      };
      
      const clients = await storage.getClients(filters);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", authenticateAny, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", authenticateAny, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", client.id, "create", clientData, userId);
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", id, "update", clientData, userId);
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", id, "delete", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Client locations routes
  app.get("/api/clients/:clientId/locations", authenticateAny, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const locations = await storage.getClientLocations(clientId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching client locations:", error);
      res.status(500).json({ message: "Failed to fetch client locations" });
    }
  });

  app.post("/api/clients/:clientId/locations", authenticateAny, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const locationData = insertClientLocationSchema.parse({ ...req.body, clientId });
      const location = await storage.createClientLocation(locationData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "add_location", locationData, userId);
      
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client location:", error);
      res.status(500).json({ message: "Failed to create client location" });
    }
  });

  app.put("/api/clients/:clientId/locations/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      const locationData = insertClientLocationSchema.partial().parse(req.body);
      const location = await storage.updateClientLocation(id, locationData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "update_location", locationData, userId);
      
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client location:", error);
      res.status(500).json({ message: "Failed to update client location" });
    }
  });

  app.delete("/api/clients/:clientId/locations/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      await storage.deleteClientLocation(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "delete_location", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client location:", error);
      res.status(500).json({ message: "Failed to delete client location" });
    }
  });

  // Client contacts routes
  app.get("/api/clients/:clientId/contacts", authenticateAny, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const contacts = await storage.getClientContacts(clientId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching client contacts:", error);
      res.status(500).json({ message: "Failed to fetch client contacts" });
    }
  });

  app.post("/api/clients/:clientId/contacts", authenticateAny, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const contactData = insertClientContactSchema.parse({ ...req.body, clientId });
      const contact = await storage.createClientContact(contactData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "add_contact", contactData, userId);
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client contact:", error);
      res.status(500).json({ message: "Failed to create client contact" });
    }
  });

  app.put("/api/clients/:clientId/contacts/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      const contactData = insertClientContactSchema.partial().parse(req.body);
      const contact = await storage.updateClientContact(id, contactData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "update_contact", contactData, userId);
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client contact:", error);
      res.status(500).json({ message: "Failed to update client contact" });
    }
  });

  app.delete("/api/clients/:clientId/contacts/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      await storage.deleteClientContact(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "delete_contact", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client contact:", error);
      res.status(500).json({ message: "Failed to delete client contact" });
    }
  });

  // Additional client contact routes for ContactForm compatibility
  app.post("/api/client-contacts", authenticateAny, async (req: any, res) => {
    try {
      const contactData = insertClientContactSchema.parse(req.body);
      const contact = await storage.createClientContact(contactData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", contactData.clientId, "add_contact", contactData, userId);
      
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client contact:", error);
      res.status(500).json({ message: "Failed to create client contact" });
    }
  });

  app.patch("/api/client-contacts/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const contactData = insertClientContactSchema.partial().parse(req.body);
      const contact = await storage.updateClientContact(id, contactData);
      
      // Log audit - get clientId from the updated contact
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      const clientId = contact.clientId ?? 0;
      await storage.logAudit("client", clientId, "update_contact", contactData, userId);
      
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client contact:", error);
      res.status(500).json({ message: "Failed to update client contact" });
    }
  });

  app.delete("/api/client-contacts/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getClientContacts(0); // We need the clientId for audit
      await storage.deleteClientContact(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", 0, "delete_contact", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client contact:", error);
      res.status(500).json({ message: "Failed to delete client contact" });
    }
  });

  // Client agreements routes
  app.get("/api/clients/:clientId/agreements", authenticateAny, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const agreements = await storage.getClientAgreements(clientId);
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching client agreements:", error);
      res.status(500).json({ message: "Failed to fetch client agreements" });
    }
  });

  app.post("/api/clients/:clientId/agreements", authenticateAny, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      const agreementData = insertClientAgreementSchema.parse({ 
        ...req.body, 
        clientId 
      });
      
      // Create agreement with authorId
      const agreement = await storage.createClientAgreement({
        ...agreementData,
        authorId: userId
      } as any);
      
      // Log audit
      await storage.logAudit("client", clientId, "add_agreement", agreementData, userId);
      
      res.status(201).json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client agreement:", error);
      res.status(500).json({ message: "Failed to create client agreement" });
    }
  });

  app.put("/api/clients/:clientId/agreements/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      const agreementData = insertClientAgreementSchema.partial().parse(req.body);
      const agreement = await storage.updateClientAgreement(id, agreementData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "update_agreement", agreementData, userId);
      
      res.json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client agreement:", error);
      res.status(500).json({ message: "Failed to update client agreement" });
    }
  });

  app.delete("/api/clients/:clientId/agreements/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientId = parseInt(req.params.clientId);
      await storage.deleteClientAgreement(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("client", clientId, "delete_agreement", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client agreement:", error);
      res.status(500).json({ message: "Failed to delete client agreement" });
    }
  });

  // Trajectory routes
  app.get("/api/trajectories", authenticateAny, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        candidateId: req.query.candidateId ? parseInt(req.query.candidateId as string) : undefined,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
      };
      
      const trajectories = await storage.getTrajectories(filters);
      res.json(trajectories);
    } catch (error) {
      console.error("Error fetching trajectories:", error);
      res.status(500).json({ message: "Failed to fetch trajectories" });
    }
  });

  app.get("/api/trajectories/:id", authenticateAny, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trajectory = await storage.getTrajectory(id);
      if (!trajectory) {
        return res.status(404).json({ message: "Trajectory not found" });
      }
      res.json(trajectory);
    } catch (error) {
      console.error("Error fetching trajectory:", error);
      res.status(500).json({ message: "Failed to fetch trajectory" });
    }
  });

  // Get trajectories for a specific candidate
  app.get("/api/trajectories/candidate/:candidateId", authenticateAny, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.candidateId);
      const filters = { candidateId };
      const trajectories = await storage.getTrajectories(filters);
      
      // Log audit
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id || 'unknown';
      await storage.logAudit("candidate", candidateId, "view_trajectories", {}, userId);
      
      res.json(trajectories);
    } catch (error) {
      console.error("Error fetching candidate trajectories:", error);
      res.status(500).json({ message: "Failed to fetch candidate trajectories" });
    }
  });

  app.post("/api/trajectories", authenticateAny, async (req: any, res) => {
    try {
      const { note, ...trajectoryBody } = req.body;
      const trajectoryData = insertTrajectorySchema.parse(trajectoryBody);
      const trajectory = await storage.createTrajectory(trajectoryData);

      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || req.adminUser?.id?.toString() || 'unknown';
      await storage.logAudit("trajectory", trajectory.id, "create", trajectoryData, userId);

      if (typeof note === "string" && note.trim()) {
        await storage.createNote({
          entityType: "trajectory",
          entityId: trajectory.id,
          content: note,
          authorId: userId,
        });
      }

      res.status(201).json(trajectory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating trajectory:", error);
      res.status(500).json({ message: "Failed to create trajectory" });
    }
  });

  app.put("/api/trajectories/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trajectoryData = insertTrajectorySchema.partial().parse(req.body);
      const trajectory = await storage.updateTrajectory(id, trajectoryData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("trajectory", id, "update", trajectoryData, userId);
      
      res.json(trajectory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating trajectory:", error);
      res.status(500).json({ message: "Failed to update trajectory" });
    }
  });

  app.delete("/api/trajectories/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrajectory(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || 'unknown';
      await storage.logAudit("trajectory", id, "delete", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trajectory:", error);
      res.status(500).json({ message: "Failed to delete trajectory" });
    }
  });

  // Notes routes
  app.get("/api/notes/:entityType/:entityId", authenticateAny, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const notes = await storage.getNotes(entityType, parseInt(entityId));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", authenticateAny, async (req: any, res) => {
    try {
      const authorId = req.user?.claims?.sub || req.user?.id || req.adminUser?.id?.toString() || 'system';
      const noteData = insertNoteSchema.parse({
        ...req.body,
        authorId,
      });
      const note = await storage.createNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", authenticateAny, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const note = await storage.updateNote(parseInt(id), content.trim());
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", authenticateAny, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNote(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Documents routes with proper authentication
  app.get("/api/documents/:entityType/:entityId", authenticateAny, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const documents = await storage.getDocuments(entityType, parseInt(entityId));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });



  // Create OneDrive link document
  app.post("/api/documents", authenticateAny, async (req: any, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || req.adminUser?.id?.toString() || 'system';
      await storage.logAudit("document", document.id, "create", documentData, userId);
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });



  // Delete OneDrive link document
  app.delete("/api/documents/:id", authenticateAny, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocument(id);
      
      // Log audit
      const userId = req.user?.claims?.sub || req.user?.id || req.adminUser?.id?.toString() || 'system';
      await storage.logAudit("document", id, "delete", {}, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
