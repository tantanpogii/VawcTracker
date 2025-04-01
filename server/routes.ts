import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DBStorage } from "./db-storage";
import jwt from "jsonwebtoken";
import { loginSchema, insertCaseSchema, caseFormSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";

// Use database storage for production or if DATABASE_URL is provided
const dbStorage = process.env.DATABASE_URL ? new DBStorage() : storage;

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SESSION_SECRET = process.env.SESSION_SECRET || "your-session-secret";

// Auth middleware
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const MemoryStoreSession = MemoryStore(session);
  
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: SESSION_SECRET,
    })
  );

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      const { username, password } = validationResult.data;
      
      // Validate user
      const user = await dbStorage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          fullName: user.fullName,
          position: user.position,
          office: user.office,
          role: user.role || 'editor'
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      // Set user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role || 'editor'
      };
      
      // Return user info and token
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          position: user.position,
          office: user.office,
          role: user.role || 'editor'
        },
        token
      });
      
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const user = await dbStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        position: user.position,
        office: user.office,
        role: user.role || 'editor'
      });
      
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard", authenticateToken, async (req: Request, res: Response) => {
    try {
      const stats = await dbStorage.getDashboardStats();
      
      // Add change percentages (mocked for in-memory storage)
      const statsWithChanges = {
        ...stats,
        totalCasesChange: "8%",
        activeCasesChange: "12%",
        pendingCasesChange: "-3%",
        closedCasesChange: "5%",
        staffActivities: [
          // Sample activities
          {
            authorId: 2,
            authorName: "Juan Dela Cruz",
            action: "Added a new case",
            timestamp: new Date(),
            victimName: stats.recentCases[0]?.victimName || "Unknown"
          },
          {
            authorId: 3,
            authorName: "Rose Manalo",
            action: "Updated case status",
            timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            victimName: stats.recentCases[1]?.victimName || "Unknown"
          }
        ]
      };
      
      return res.json(statsWithChanges);
      
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Case routes
  app.get("/api/cases", authenticateToken, async (req: Request, res: Response) => {
    try {
      const cases = await dbStorage.getCases();
      return res.json(cases);
    } catch (error) {
      console.error("Get cases error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/cases/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      const caseWithDetails = await dbStorage.getCaseWithDetails(caseId);
      
      if (!caseWithDetails) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      return res.json(caseWithDetails);
      
    } catch (error) {
      console.error("Get case error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/cases", authenticateToken, async (req: Request, res: Response) => {
    try {
      // For creating cases, we'll use the raw request body and manually validate
      try {
        // Required fields validation
        if (!req.body.victimName || typeof req.body.victimName !== 'string') {
          return res.status(400).json({ message: "Victim name is required and must be a string" });
        }
        
        if (!req.body.incidentType || typeof req.body.incidentType !== 'string') {
          return res.status(400).json({ message: "Incident type is required and must be a string" });
        }
        
        if (!req.body.perpetratorName || typeof req.body.perpetratorName !== 'string') {
          return res.status(400).json({ message: "Perpetrator name is required and must be a string" });
        }
        
        if (!req.body.encoderName || typeof req.body.encoderName !== 'string') {
          return res.status(400).json({ message: "Encoder name is required and must be a string" });
        }
        
        if (!req.body.status || !['active', 'pending', 'closed'].includes(req.body.status)) {
          return res.status(400).json({ message: "Status is required and must be one of: active, pending, closed" });
        }
        
        // Handle date conversion
        const caseData: any = { ...req.body };
        delete caseData.services;
        delete caseData.otherServices;
        delete caseData.caseNotes;
        
        // Convert incident date if it's a string
        if (!caseData.incidentDate) {
          return res.status(400).json({ message: "Incident date is required" });
        }
        
        if (typeof caseData.incidentDate === 'string') {
          try {
            caseData.incidentDate = new Date(caseData.incidentDate);
            if (isNaN(caseData.incidentDate.getTime())) {
              throw new Error("Invalid date format");
            }
          } catch (dateError) {
            return res.status(400).json({ message: "Invalid incident date format" });
          }
        }
        
        // Create the case
        const newCase = await dbStorage.createCase(caseData);
        
        // Add services if provided
        if (req.body.services) {
          const serviceTypes = req.body.services
            .filter((s: { type: string, selected: boolean }) => s.selected)
            .map((s: { type: string }) => s.type);
            
          for (const type of serviceTypes) {
            await dbStorage.addService({
              type,
              dateProvided: new Date(),
              provider: req.body.encoderName,
              caseId: newCase.id
            });
          }
        }
        
        // Add initial note if provided
        if (req.body.caseNotes) {
          await dbStorage.addNote({
            content: req.body.caseNotes,
            authorId: req.user.id,
            caseId: newCase.id
          });
        }
        
        return res.status(201).json(newCase);
      } catch (validationError) {
        return res.status(400).json({
          message: "Validation error",
          error: (validationError as Error).message
        });
      }
    } catch (error) {
      console.error("Create case error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/cases/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      // For updates, we'll use the raw request body and manually validate required fields
      // This avoids issues with the transformed schema
      try {
        // Basic validation of critical fields if they exist in the payload
        if (req.body.victimName !== undefined && typeof req.body.victimName !== 'string') {
          return res.status(400).json({ message: "Victim name must be a string" });
        }
        
        if (req.body.incidentType !== undefined && typeof req.body.incidentType !== 'string') {
          return res.status(400).json({ message: "Incident type must be a string" });
        }
        
        if (req.body.perpetratorName !== undefined && typeof req.body.perpetratorName !== 'string') {
          return res.status(400).json({ message: "Perpetrator name must be a string" });
        }
        
        if (req.body.status !== undefined && !['active', 'pending', 'closed'].includes(req.body.status)) {
          return res.status(400).json({ message: "Status must be one of: active, pending, closed" });
        }
        
        // Handle date conversion if needed
        const caseData: any = { ...req.body };
        delete caseData.services;
        delete caseData.otherServices;
        delete caseData.caseNotes;
        
        // Convert incident date if it's a string
        if (caseData.incidentDate && typeof caseData.incidentDate === 'string') {
          caseData.incidentDate = new Date(caseData.incidentDate);
        }
        
        // Update the case
        const updatedCase = await dbStorage.updateCase(caseId, caseData);
        
        if (!updatedCase) {
          return res.status(404).json({ message: "Case not found" });
        }
        
        // Update services if provided
        if (req.body.services) {
          const serviceTypes = req.body.services
            .filter((s: { type: string, selected: boolean }) => s.selected)
            .map((s: { type: string }) => s.type);
            
          // First get existing services to avoid duplicates
          const existingServices = await dbStorage.getCaseServices(caseId);
          const existingTypes = existingServices.map(s => s.type);
          
          // Add new services
          for (const type of serviceTypes) {
            if (!existingTypes.includes(type)) {
              await dbStorage.addService({
                type,
                dateProvided: new Date(),
                provider: req.body.encoderName || updatedCase.encoderName,
                caseId
              });
            }
          }
        }
        
        // Add new note if provided
        if (req.body.caseNotes) {
          await dbStorage.addNote({
            content: req.body.caseNotes,
            authorId: req.user.id,
            caseId
          });
        }
        
        return res.json(updatedCase);
      } catch (validationError) {
        return res.status(400).json({
          message: "Validation error",
          error: (validationError as Error).message
        });
      }
    } catch (error) {
      console.error("Update case error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/cases/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      const deleted = await dbStorage.deleteCase(caseId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      return res.json({ message: "Case deleted successfully" });
      
    } catch (error) {
      console.error("Delete case error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Note routes
  app.post("/api/cases/:id/notes", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      // Validate note content
      if (!req.body.content || typeof req.body.content !== "string") {
        return res.status(400).json({ message: "Note content is required" });
      }
      
      // Add the note
      const note = await dbStorage.addNote({
        content: req.body.content,
        authorId: req.user.id,
        caseId
      });
      
      // Get author info
      const author = await dbStorage.getUser(req.user.id);
      
      return res.status(201).json({
        ...note,
        author: {
          id: author?.id || 0,
          fullName: author?.fullName || "Unknown"
        }
      });
      
    } catch (error) {
      console.error("Add note error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Service routes
  app.post("/api/cases/:id/services", authenticateToken, async (req: Request, res: Response) => {
    try {
      const caseId = parseInt(req.params.id);
      
      if (isNaN(caseId)) {
        return res.status(400).json({ message: "Invalid case ID" });
      }
      
      // Validate service data
      if (!req.body.type || !req.body.provider || !req.body.dateProvided) {
        return res.status(400).json({ message: "Service type, provider, and date are required" });
      }
      
      // Add the service
      const service = await dbStorage.addService({
        type: req.body.type,
        provider: req.body.provider,
        dateProvided: new Date(req.body.dateProvided),
        notes: req.body.notes || "",
        caseId
      });
      
      return res.status(201).json(service);
      
    } catch (error) {
      console.error("Add service error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
