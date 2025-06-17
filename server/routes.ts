import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
import { 
  insertCandidateSchema, 
  insertClientSchema, 
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

  // Authentication middleware using simple session auth with admin token fallback
  const authenticateAny: any = async (req: any, res: any, next: any) => {
    // First try admin authentication for admin API routes
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (adminToken) {
      try {
        const decoded = verifyToken(adminToken);
        req.adminUser = decoded;
        return next();
      } catch (error) {
        // Admin token invalid, continue to try user auth
      }
    }

    // Use session-based user authentication
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify user exists and is active
    const userId = req.session.userId;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    req.user = user;
    next();
  };

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
      const candidateData = insertCandidateSchema.parse(req.body);
      
      // Normaliseer rijbewijs data als aanwezig
      if (candidateData.drivingLicenses && candidateData.drivingLicenses.length > 0) {
        const rawLicenseString = candidateData.drivingLicenses.join(', ');
        const normalized = normalizeDrivingLicense(rawLicenseString);
        candidateData.drivingLicenses = normalized.licenses;
      }
      
      const candidate = await storage.createCandidate(candidateData);
      
      // Log audit
      await storage.logAudit("candidate", candidate.id, "create", candidateData, req.user.claims.sub);
      
      res.status(201).json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating candidate:", error);
      res.status(500).json({ message: "Failed to create candidate" });
    }
  });

  app.put("/api/candidates/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidateData = insertCandidateSchema.partial().parse(req.body);
      
      // Normaliseer rijbewijs data als aanwezig
      if (candidateData.drivingLicenses && candidateData.drivingLicenses.length > 0) {
        const rawLicenseString = candidateData.drivingLicenses.join(', ');
        const normalized = normalizeDrivingLicense(rawLicenseString);
        candidateData.drivingLicenses = normalized.licenses;
      }
      
      const candidate = await storage.updateCandidate(id, candidateData);
      
      // Log audit
      await storage.logAudit("candidate", id, "update", candidateData, req.user.claims.sub);
      
      res.json(candidate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating candidate:", error);
      res.status(500).json({ message: "Failed to update candidate" });
    }
  });

  app.delete("/api/candidates/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCandidate(id);
      
      // Log audit
      await storage.logAudit("candidate", id, "delete", {}, req.user.claims.sub);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Excel import route for candidates
  app.post("/api/candidates/import", authenticateUser, upload.single('file'), async (req: any, res) => {
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

          // Validate and create candidate
          const validatedData = insertCandidateSchema.parse(candidateData);
          await storage.createCandidate(validatedData);
          
          // Log audit
          await storage.logAudit("candidate", 0, "import", candidateData, req.user.claims.sub);
          
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
  app.post("/api/normalize-all-licenses", authenticateUser, async (req, res) => {
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
  app.get("/api/clients", authenticateUser, async (req, res) => {
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

  app.get("/api/clients/:id", authenticateUser, async (req, res) => {
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

  app.post("/api/clients", authenticateUser, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      
      // Log audit
      await storage.logAudit("client", client.id, "create", clientData, req.user.claims.sub);
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      
      // Log audit
      await storage.logAudit("client", id, "update", clientData, req.user.claims.sub);
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      
      // Log audit
      await storage.logAudit("client", id, "delete", {}, req.user.claims.sub);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Trajectory routes
  app.get("/api/trajectories", authenticateUser, async (req, res) => {
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

  app.get("/api/trajectories/:id", authenticateUser, async (req, res) => {
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

  app.post("/api/trajectories", authenticateUser, async (req: any, res) => {
    try {
      const trajectoryData = insertTrajectorySchema.parse(req.body);
      const trajectory = await storage.createTrajectory(trajectoryData);
      
      // Log audit
      await storage.logAudit("trajectory", trajectory.id, "create", trajectoryData, req.user.claims.sub);
      
      res.status(201).json(trajectory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating trajectory:", error);
      res.status(500).json({ message: "Failed to create trajectory" });
    }
  });

  app.put("/api/trajectories/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const trajectoryData = insertTrajectorySchema.partial().parse(req.body);
      const trajectory = await storage.updateTrajectory(id, trajectoryData);
      
      // Log audit
      await storage.logAudit("trajectory", id, "update", trajectoryData, req.user.claims.sub);
      
      res.json(trajectory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating trajectory:", error);
      res.status(500).json({ message: "Failed to update trajectory" });
    }
  });

  app.delete("/api/trajectories/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrajectory(id);
      
      // Log audit
      await storage.logAudit("trajectory", id, "delete", {}, req.user.claims.sub);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trajectory:", error);
      res.status(500).json({ message: "Failed to delete trajectory" });
    }
  });

  // Notes routes
  app.get("/api/notes/:entityType/:entityId", authenticateUser, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const notes = await storage.getNotes(entityType, parseInt(entityId));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", authenticateUser, async (req: any, res) => {
    try {
      const authorId = req.user?.claims?.sub || req.adminUser?.id?.toString() || 'system';
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

  // Documents routes
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

  app.post("/api/documents", authenticateAny, async (req: any, res) => {
    try {
      const uploadedBy = req.user?.claims?.sub || req.adminUser?.id?.toString() || 'system';
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        uploadedBy,
      });
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.delete("/api/documents/:id", authenticateAny, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
