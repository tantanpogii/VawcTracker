import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { loginSchema, insertCaseSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcrypt";

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
      const user = await storage.validateUser(username, password);
      
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
          office: user.office
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      // Set user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName
      };
      
      // Return user info and token
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          position: user.position,
          office: user.office
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
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        position: user.position,
        office: user.office
      });
      
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard", authenticateToken, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      
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
      const cases = await storage.getCases();
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
      
      const caseWithDetails = await storage.getCaseWithDetails(caseId);
      
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
      // Validate case data
      const validationResult = insertCaseSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      // Create the case
      const newCase = await storage.createCase(validationResult.data);
      
      // Add services if provided
      if (req.body.services) {
        const serviceTypes = req.body.services
          .filter((s: { type: string, selected: boolean }) => s.selected)
          .map((s: { type: string }) => s.type);
          
        for (const type of serviceTypes) {
          await storage.addService({
            type,
            dateProvided: new Date(),
            provider: req.body.encoderName,
            caseId: newCase.id
          });
        }
      }
      
      // Add initial note if provided
      if (req.body.caseNotes) {
        await storage.addNote({
          content: req.body.caseNotes,
          authorId: req.user.id,
          caseId: newCase.id
        });
      }
      
      return res.status(201).json(newCase);
      
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
      
      // Validate case data
      const validationResult = insertCaseSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: validationResult.error.errors 
        });
      }
      
      // Update the case
      const updatedCase = await storage.updateCase(caseId, validationResult.data);
      
      if (!updatedCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      return res.json(updatedCase);
      
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
      
      const deleted = await storage.deleteCase(caseId);
      
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
      const note = await storage.addNote({
        content: req.body.content,
        authorId: req.user.id,
        caseId
      });
      
      // Get author info
      const author = await storage.getUser(req.user.id);
      
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
      const service = await storage.addService({
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
