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
  dateReported: timestamp("date_reported").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  victimName: text("victim_name").notNull(),
  perpetratorName: text("perpetrator_name").notNull(),
  barangay: text("barangay").notNull(),
  status: text("status").notNull(), // active, pending, closed
  encoderId: integer("encoder_id").notNull(),
  encoderName: text("encoder_name").notNull(),
  encoderPosition: text("encoder_position").notNull(),
  encoderOffice: text("encoder_office").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

// Form schema for case creation/editing with services
export const caseFormSchema = insertCaseSchema.extend({
  services: z.array(
    z.object({
      type: z.string(),
      selected: z.boolean()
    })
  ),
  otherServices: z.string().optional(),
  caseNotes: z.string().optional()
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
