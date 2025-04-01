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
    const adminUser = await this.createUser({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      position: "System Administrator",
      office: "VAWC Office"
    });

    // Create some sample staff users
    const staffPassword = await bcrypt.hash("password", 10);
    const juanUser = await this.createUser({
      username: "jdelacruz",
      password: staffPassword,
      fullName: "Juan Dela Cruz",
      position: "VAWC Coordinator",
      office: "Municipal Social Welfare Department"
    });
    
    const roseUser = await this.createUser({
      username: "rmanalo",
      password: staffPassword,
      fullName: "Rose Manalo",
      position: "Social Worker",
      office: "Municipal Social Welfare Department"
    });

    // Create 5 sample VAWC cases
    
    // Case 1
    const case1 = await this.createCase({
      dateReported: new Date(2023, 11, 15),
      entryDate: new Date(2023, 11, 16),
      victimName: "Maria Santos",
      perpetratorName: "Pedro Santos",
      barangay: "Barangay Poblacion",
      status: "active",
      encoderId: adminUser.id,
      encoderName: adminUser.fullName,
      encoderPosition: adminUser.position,
      encoderOffice: adminUser.office
    });
    
    // Add service for case 1
    await this.addService({
      type: "Medical assistance",
      dateProvided: new Date(2023, 11, 17),
      provider: "Municipal Health Office",
      notes: "Initial medical examination conducted",
      caseId: case1.id
    });
    
    // Add notes for case 1
    await this.addNote({
      content: "Victim reported multiple physical abuse incidents in the past 3 months",
      authorId: adminUser.id,
      caseId: case1.id
    });
    
    // Case 2
    const case2 = await this.createCase({
      dateReported: new Date(2023, 11, 10),
      entryDate: new Date(2023, 11, 10),
      victimName: "Ana Reyes",
      perpetratorName: "Roberto Garcia",
      barangay: "Barangay San Jose",
      status: "pending",
      encoderId: juanUser.id,
      encoderName: juanUser.fullName,
      encoderPosition: juanUser.position,
      encoderOffice: juanUser.office
    });
    
    // Add service for case 2
    await this.addService({
      type: "Legal assistance",
      dateProvided: new Date(2023, 11, 12),
      provider: "Municipal Legal Office",
      notes: "Provided legal advice and assisted in filing protection order",
      caseId: case2.id
    });
    
    // Add service for case 2
    await this.addService({
      type: "Counseling",
      dateProvided: new Date(2023, 11, 13),
      provider: "DSWD Counselor",
      notes: "Initial psychological assessment conducted",
      caseId: case2.id
    });
    
    // Add notes for case 2
    await this.addNote({
      content: "Victim seeking protection order against ex-partner",
      authorId: juanUser.id,
      caseId: case2.id
    });
    
    // Case 3
    const case3 = await this.createCase({
      dateReported: new Date(2023, 10, 5),
      entryDate: new Date(2023, 10, 5),
      victimName: "Sophia Cruz",
      perpetratorName: "Miguel Cruz",
      barangay: "Barangay Santa Clara",
      status: "closed",
      encoderId: roseUser.id,
      encoderName: roseUser.fullName,
      encoderPosition: roseUser.position,
      encoderOffice: roseUser.office
    });
    
    // Add service for case 3
    await this.addService({
      type: "Temporary shelter",
      dateProvided: new Date(2023, 10, 5),
      provider: "Municipal VAWC Shelter",
      notes: "Provided temporary housing for 7 days",
      caseId: case3.id
    });
    
    // Add notes for case 3
    await this.addNote({
      content: "Case resolved through family mediation. Victim reconciled with partner after counseling.",
      authorId: roseUser.id,
      caseId: case3.id
    });
    
    // Add follow-up note
    await this.addNote({
      content: "Follow-up visit conducted. Situation remains stable.",
      authorId: adminUser.id,
      caseId: case3.id
    });

    // Case 4
    const case4 = await this.createCase({
      dateReported: new Date(2023, 11, 28),
      entryDate: new Date(2023, 11, 28),
      victimName: "Jasmine Martinez",
      perpetratorName: "Antonio Reyes",
      barangay: "Barangay Mabuhay",
      status: "active",
      encoderId: juanUser.id,
      encoderName: juanUser.fullName,
      encoderPosition: juanUser.position,
      encoderOffice: juanUser.office
    });
    
    // Add service for case 4
    await this.addService({
      type: "Medical assistance",
      dateProvided: new Date(2023, 11, 28),
      provider: "Provincial Hospital",
      notes: "Treated for injuries and provided medical certificate",
      caseId: case4.id
    });
    
    // Add notes for case 4
    await this.addNote({
      content: "Victim reported physical and verbal abuse by employer. Filed police report.",
      authorId: juanUser.id,
      caseId: case4.id
    });

    // Case 5
    const case5 = await this.createCase({
      dateReported: new Date(2023, 11, 20),
      entryDate: new Date(2023, 11, 21),
      victimName: "Lilia Mendoza",
      perpetratorName: "Eduardo Mendoza",
      barangay: "Barangay Bagong Silang",
      status: "pending",
      encoderId: roseUser.id,
      encoderName: roseUser.fullName,
      encoderPosition: roseUser.position,
      encoderOffice: roseUser.office
    });
    
    // Add service for case 5
    await this.addService({
      type: "Counseling",
      dateProvided: new Date(2023, 11, 22),
      provider: "Municipal Psychologist",
      notes: "Initial counseling session provided",
      caseId: case5.id
    });
    
    // Add service for case 5
    await this.addService({
      type: "Financial assistance",
      dateProvided: new Date(2023, 11, 23),
      provider: "DSWD",
      notes: "Emergency financial assistance provided for basic needs",
      caseId: case5.id
    });
    
    // Add notes for case 5
    await this.addNote({
      content: "Victim seeking separation from spouse due to recurring domestic violence",
      authorId: roseUser.id,
      caseId: case5.id
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
    
    // Create detailed cases with services and notes
    const detailedCases = await Promise.all(
      recentCases.map(async (caseItem) => {
        return this.getCaseWithDetails(caseItem.id);
      })
    );
    
    // Filter out any undefined results
    const validDetailedCases = detailedCases.filter(
      (caseItem): caseItem is CaseWithDetails => caseItem !== undefined
    );
    
    // Create sample staff activities
    const staffActivities = [
      {
        authorId: 1,
        authorName: "Admin User",
        action: "Created new case",
        timestamp: new Date(2023, 11, 16),
        caseId: 1,
        victimName: "Maria Santos"
      },
      {
        authorId: 2,
        authorName: "Juan Dela Cruz",
        action: "Added legal assistance service",
        timestamp: new Date(2023, 11, 12),
        caseId: 2,
        victimName: "Ana Reyes"
      },
      {
        authorId: 3,
        authorName: "Rose Manalo",
        action: "Closed case",
        timestamp: new Date(2023, 10, 15),
        caseId: 3,
        victimName: "Sophia Cruz"
      },
      {
        authorId: 2,
        authorName: "Juan Dela Cruz",
        action: "Filed police report",
        timestamp: new Date(2023, 11, 28),
        caseId: 4,
        victimName: "Jasmine Martinez"
      },
      {
        authorId: 3,
        authorName: "Rose Manalo",
        action: "Added counseling service",
        timestamp: new Date(2023, 11, 22),
        caseId: 5,
        victimName: "Lilia Mendoza"
      },
      {
        authorId: 1,
        authorName: "Admin User",
        action: "Updated case information",
        timestamp: new Date(2023, 11, 30),
        caseId: 1,
        victimName: "Maria Santos"
      },
    ];
    
    return {
      totalCases: allCases.length,
      activeCases: activeCases.length,
      pendingCases: pendingCases.length,
      closedCases: closedCases.length,
      totalCasesChange: "+20%",
      activeCasesChange: "+10%",
      pendingCasesChange: "+5%",
      closedCasesChange: "-2%",
      recentCases: validDetailedCases,
      staffActivities
    };
  }
}

export const storage = new MemStorage();
