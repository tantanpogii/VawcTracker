import { 
  users, type User, type InsertUser, 
  cases, type Case, type InsertCase,
  services, type Service, type InsertService,
  notes, type Note, type InsertNote,
  type CaseWithDetails
} from "@shared/schema";
import bcrypt from 'bcrypt';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;
  
  // Case operations
  createCase(caseData: InsertCase): Promise<Case>;
  getCase(id: number): Promise<Case | undefined>;
  getCases(): Promise<Case[]>;
  getCaseWithDetails(id: number): Promise<CaseWithDetails | undefined>;
  updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: number): Promise<boolean>;
  
  // Service operations
  addService(service: InsertService): Promise<Service>;
  getCaseServices(caseId: number): Promise<Service[]>;
  
  // Note operations
  addNote(note: InsertNote): Promise<Note>;
  getCaseNotes(caseId: number): Promise<Note[]>;
  
  // Dashboard operations
  getDashboardStats(): Promise<{
    totalCases: number;
    activeCases: number;
    pendingCases: number;
    closedCases: number;
    recentCases: Case[];
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cases: Map<number, Case>;
  private services: Map<number, Service>;
  private notes: Map<number, Note>;
  private currentUserId: number;
  private currentCaseId: number;
  private currentServiceId: number;
  private currentNoteId: number;

  constructor() {
    this.users = new Map();
    this.cases = new Map();
    this.services = new Map();
    this.notes = new Map();
    this.currentUserId = 1;
    this.currentCaseId = 1;
    this.currentServiceId = 1;
    this.currentNoteId = 1;
    
    // Create admin user by default
    this.createInitialData();
  }

  private async createInitialData() {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    this.createUser({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      position: "System Administrator",
      office: "VAWC Office"
    });

    // Create some sample staff users
    const staffPassword = await bcrypt.hash("password", 10);
    this.createUser({
      username: "jdelacruz",
      password: staffPassword,
      fullName: "Juan Dela Cruz",
      position: "VAWC Coordinator",
      office: "Municipal Social Welfare Department"
    });
    
    this.createUser({
      username: "rmanalo",
      password: staffPassword,
      fullName: "Rose Manalo",
      position: "Social Worker",
      office: "Municipal Social Welfare Department"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Case methods
  async createCase(caseData: InsertCase): Promise<Case> {
    const id = this.currentCaseId++;
    const now = new Date();
    const newCase: Case = {
      ...caseData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async getCase(id: number): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(): Promise<Case[]> {
    return Array.from(this.cases.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getCaseWithDetails(id: number): Promise<CaseWithDetails | undefined> {
    const foundCase = await this.getCase(id);
    if (!foundCase) return undefined;
    
    const caseServices = await this.getCaseServices(id);
    const caseNotes = await this.getCaseNotes(id);
    
    // Get author information for each note
    const notesWithAuthor = await Promise.all(
      caseNotes.map(async (note) => {
        const author = await this.getUser(note.authorId);
        return {
          ...note,
          author: {
            id: author?.id || 0,
            fullName: author?.fullName || 'Unknown'
          }
        };
      })
    );
    
    return {
      ...foundCase,
      services: caseServices,
      notes: notesWithAuthor
    };
  }

  async updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = await this.getCase(id);
    if (!existingCase) return undefined;
    
    const updatedCase: Case = {
      ...existingCase,
      ...caseData,
      updatedAt: new Date()
    };
    
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async deleteCase(id: number): Promise<boolean> {
    // Check if the case exists
    if (!this.cases.has(id)) return false;
    
    // Delete the case
    this.cases.delete(id);
    
    // Delete related services
    for (const [serviceId, service] of this.services.entries()) {
      if (service.caseId === id) {
        this.services.delete(serviceId);
      }
    }
    
    // Delete related notes
    for (const [noteId, note] of this.notes.entries()) {
      if (note.caseId === id) {
        this.notes.delete(noteId);
      }
    }
    
    return true;
  }

  // Service methods
  async addService(serviceData: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const now = new Date();
    const service: Service = {
      ...serviceData,
      id,
      createdAt: now
    };
    this.services.set(id, service);
    return service;
  }

  async getCaseServices(caseId: number): Promise<Service[]> {
    return Array.from(this.services.values())
      .filter(service => service.caseId === caseId)
      .sort((a, b) => b.dateProvided.getTime() - a.dateProvided.getTime());
  }

  // Note methods
  async addNote(noteData: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const now = new Date();
    const note: Note = {
      ...noteData,
      id,
      createdAt: now
    };
    this.notes.set(id, note);
    return note;
  }

  async getCaseNotes(caseId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.caseId === caseId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Dashboard stats
  async getDashboardStats() {
    const allCases = await this.getCases();
    const activeCases = allCases.filter(c => c.status === 'active');
    const pendingCases = allCases.filter(c => c.status === 'pending');
    const closedCases = allCases.filter(c => c.status === 'closed');
    
    // Get recent cases (up to 5)
    const recentCases = allCases
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    
    return {
      totalCases: allCases.length,
      activeCases: activeCases.length,
      pendingCases: pendingCases.length,
      closedCases: closedCases.length,
      recentCases
    };
  }
}

export const storage = new MemStorage();
