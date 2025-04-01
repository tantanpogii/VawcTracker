import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  position: text("position"),
  office: text("office"),
  role: text("role").default("editor").notNull(), // administrator or editor
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Services provided to victims
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // medical, legal, counseling, etc.
  dateProvided: timestamp("date_provided").notNull(),
  provider: text("provider").notNull(), // name of service provider
  notes: text("notes"),
  caseId: integer("case_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Case notes
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull(),
  caseId: integer("case_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// VAWC Cases
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  victimName: text("victim_name").notNull(),
  victimAge: integer("victim_age"),
  victimGender: text("victim_gender"),
  barangay: text("barangay"), // Added barangay field
  incidentDate: timestamp("incident_date").notNull(),
  incidentType: text("incident_type").notNull(),
  incidentLocation: text("incident_location"),
  perpetratorName: text("perpetrator_name").notNull(),
  perpetratorRelationship: text("perpetrator_relationship"),
  encoderName: text("encoder_name").notNull(),
  status: text("status").notNull(), // active, pending, closed
  priority: text("priority"),
  caseNotes: text("case_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true, 
  createdAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Form schema for case creation/editing with services
// We need to accept date as string or Date object
const dateSchema = z.union([
  z.string().refine((date) => !isNaN(new Date(date).getTime()), {
    message: "Invalid date string",
  }),
  z.date()
]);

export const caseFormSchema = insertCaseSchema
  .omit({ incidentDate: true }) // Remove the strict Date field
  .extend({
    incidentDate: dateSchema, // Replace with our flexible date schema
    services: z.array(
      z.object({
        type: z.string(),
        selected: z.boolean()
      })
    ),
    otherServices: z.string().optional(),
    caseNotes: z.string().optional()
  })
  .transform((data) => {
    // For API use, always convert to Date object
    return {
      ...data,
      incidentDate: data.incidentDate instanceof Date 
        ? data.incidentDate 
        : new Date(data.incidentDate),
    };
  });

export type CaseFormData = z.infer<typeof caseFormSchema>;

// Extended case type with services and notes for the frontend
export type CaseWithDetails = Case & {
  services: Service[];
  notes: (Note & { author: Pick<User, 'id' | 'fullName'> })[];
};

// For dashboard statistics
export type DashboardStats = {
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  closedCases: number;
  totalCasesChange: string;
  activeCasesChange: string;
  pendingCasesChange: string;
  closedCasesChange: string;
  recentCases: CaseWithDetails[];
  staffActivities: Array<{
    authorId: number;
    authorName: string;
    action: string;
    timestamp: Date;
    caseId?: number;
    victimName?: string;
  }>;
};

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;
