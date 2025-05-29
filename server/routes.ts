import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import * as XLSX from "xlsx";
import { 
  insertCandidateSchema, 
  insertClientSchema, 
  insertTrajectorySchema,
  insertNoteSchema,
  insertDocumentSchema
} from "@shared/schema";
import { z } from "zod";

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

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Candidate routes
  app.get("/api/candidates", isAuthenticated, async (req, res) => {
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

  app.get("/api/candidates/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidate(id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  app.post("/api/candidates", isAuthenticated, async (req: any, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
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

  app.put("/api/candidates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidateData = insertCandidateSchema.partial().parse(req.body);
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

  app.delete("/api/candidates/:id", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/candidates/import", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Geen bestand geüpload" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

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
            drivingLicenses: rowData.Rijbewijs || rowData.rijbewijs ? 
              String(rowData.Rijbewijs || rowData.rijbewijs).split(/[,;]/).map(s => s.trim()).filter(s => s) : 
              [],
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
        errors: errors
      });

    } catch (error) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({ message: "Fout bij het importeren van het Excel bestand" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
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

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/clients/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/trajectories", isAuthenticated, async (req, res) => {
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

  app.get("/api/trajectories/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/trajectories", isAuthenticated, async (req: any, res) => {
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

  app.put("/api/trajectories/:id", isAuthenticated, async (req: any, res) => {
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

  app.delete("/api/trajectories/:id", isAuthenticated, async (req: any, res) => {
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
  app.get("/api/notes/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const notes = await storage.getNotes(entityType, parseInt(entityId));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const noteData = insertNoteSchema.parse({
        ...req.body,
        authorId: req.user.claims.sub,
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
  app.get("/api/documents/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const documents = await storage.getDocuments(entityType, parseInt(entityId));
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
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

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
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
