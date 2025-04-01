import { 
  users, type User, type InsertUser, 
  cases, type Case, type InsertCase,
  services, type Service, type InsertService,
  notes, type Note, type InsertNote,
  type CaseWithDetails
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./database";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from 'bcrypt';

export class DBStorage implements IStorage {
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    try {
      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error("Error validating user password:", error);
      return null;
    }
  }

  // Case methods
  async createCase(caseData: any): Promise<Case> {
    // Convert the incoming data to match the new schema if needed
    const newCaseData = {
      victimName: caseData.victimName,
      incidentDate: caseData.incidentDate || new Date(),
      incidentType: caseData.incidentType || "Not specified",
      perpetratorName: caseData.perpetratorName,
      encoderName: caseData.encoderName,
      status: caseData.status,
      priority: caseData.priority || "Medium",
      victimAge: caseData.victimAge || null,
      victimGender: caseData.victimGender || null,
      incidentLocation: caseData.incidentLocation || null,
      perpetratorRelationship: caseData.perpetratorRelationship || null,
      caseNotes: caseData.caseNotes || null
    };
    
    const result = await db.insert(cases).values(newCaseData).returning();
    return result[0];
  }

  async getCase(id: number): Promise<Case | undefined> {
    const results = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
    return results[0];
  }

  async getCases(): Promise<Case[]> {
    return db.select().from(cases).orderBy(desc(cases.createdAt));
  }

  async getCaseWithDetails(id: number): Promise<CaseWithDetails | undefined> {
    const caseItem = await this.getCase(id);
    if (!caseItem) return undefined;
    
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
      ...caseItem,
      services: caseServices,
      notes: notesWithAuthor
    };
  }

  async updateCase(id: number, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = await this.getCase(id);
    if (!existingCase) return undefined;
    
    const result = await db
      .update(cases)
      .set(caseData)
      .where(eq(cases.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCase(id: number): Promise<boolean> {
    // Check if the case exists
    const caseItem = await this.getCase(id);
    if (!caseItem) return false;
    
    // Delete services first (foreign key constraint)
    await db.delete(services).where(eq(services.caseId, id));
    
    // Delete notes (foreign key constraint)
    await db.delete(notes).where(eq(notes.caseId, id));
    
    // Delete the case
    const result = await db.delete(cases).where(eq(cases.id, id)).returning();
    
    return result.length > 0;
  }

  // Service methods
  async addService(serviceData: InsertService): Promise<Service> {
    const result = await db.insert(services).values(serviceData).returning();
    return result[0];
  }

  async getCaseServices(caseId: number): Promise<Service[]> {
    return db
      .select()
      .from(services)
      .where(eq(services.caseId, caseId))
      .orderBy(desc(services.dateProvided));
  }

  // Note methods
  async addNote(noteData: InsertNote): Promise<Note> {
    const result = await db.insert(notes).values(noteData).returning();
    return result[0];
  }

  async getCaseNotes(caseId: number): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(eq(notes.caseId, caseId))
      .orderBy(desc(notes.createdAt));
  }

  // Dashboard stats
  async getDashboardStats() {
    const allCases = await this.getCases();
    const activeCases = allCases.filter(c => c.status === 'active');
    const pendingCases = allCases.filter(c => c.status === 'pending');
    const closedCases = allCases.filter(c => c.status === 'closed');
    
    // Get recent cases (up to 5)
    const recentCases = allCases.slice(0, 5);
    
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
    
    // Get recent staff activities
    const recentNotes = await db
      .select({
        id: notes.id,
        content: notes.content,
        authorId: notes.authorId,
        caseId: notes.caseId,
        createdAt: notes.createdAt
      })
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(5);
    
    // Create staff activities based on notes
    const staffActivities = await Promise.all(
      recentNotes.map(async (note) => {
        const author = await this.getUser(note.authorId);
        const caseItem = note.caseId ? await this.getCase(note.caseId) : null;
        
        return {
          authorId: note.authorId,
          authorName: author?.fullName || 'Unknown',
          action: "Added case note",
          timestamp: note.createdAt,
          caseId: note.caseId,
          victimName: caseItem?.victimName
        };
      })
    );
    
    // Add some mock percentage changes
    // In a real app, this would compare to previous period
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

  // Seed database with initial data
  async seedDatabase() {
    console.log("Seeding database with initial data...");
    
    try {
      // Check if users already exist
      const existingUsers = await db.select().from(users);
      if (existingUsers.length > 0) {
        console.log("Database already seeded. Skipping...");
        return;
      }
      
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
        incidentDate: new Date(2023, 11, 15),
        victimName: "Maria Santos",
        victimAge: 32,
        victimGender: "Female",
        incidentType: "Physical abuse",
        incidentLocation: "Residence",
        perpetratorName: "Pedro Santos",
        perpetratorRelationship: "Husband",
        status: "active",
        priority: "High",
        encoderName: adminUser.fullName
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
        incidentDate: new Date(2023, 11, 10),
        victimName: "Ana Reyes",
        victimAge: 28,
        victimGender: "Female",
        incidentType: "Verbal abuse",
        incidentLocation: "Workplace",
        perpetratorName: "Roberto Garcia",
        perpetratorRelationship: "Ex-boyfriend",
        status: "pending",
        priority: "Medium",
        encoderName: juanUser.fullName
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
        incidentDate: new Date(2023, 10, 5),
        victimName: "Sophia Cruz",
        victimAge: 35,
        victimGender: "Female",
        incidentType: "Economic abuse",
        incidentLocation: "Residence",
        perpetratorName: "Miguel Cruz",
        perpetratorRelationship: "Husband",
        status: "closed",
        priority: "Low",
        encoderName: roseUser.fullName
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
        incidentDate: new Date(2023, 11, 28),
        victimName: "Jasmine Martinez",
        victimAge: 22,
        victimGender: "Female",
        incidentType: "Workplace harassment",
        incidentLocation: "Office building",
        perpetratorName: "Antonio Reyes",
        perpetratorRelationship: "Employer",
        status: "active",
        priority: "High",
        encoderName: juanUser.fullName
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
        incidentDate: new Date(2023, 11, 20),
        victimName: "Lilia Mendoza",
        victimAge: 29,
        victimGender: "Female",
        incidentType: "Physical and emotional abuse",
        incidentLocation: "Residence",
        perpetratorName: "Eduardo Mendoza",
        perpetratorRelationship: "Spouse",
        status: "pending",
        priority: "Medium",
        encoderName: roseUser.fullName
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
      
      console.log("Database successfully seeded with initial data");
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  }
}