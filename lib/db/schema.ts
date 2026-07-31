import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  type: text("type", {
    enum: [
      "scholarship",
      "fellowship",
      "job",
      "internship",
      "grant",
      "accelerator",
      "competition",
      "conference",
      "research",
      "hackathon",
    ],
  }).notNull(),
  provider: text("provider").notNull(),
  description: text("description").notNull(),
  eligibilityCriteria: text("eligibility_criteria").notNull(),
  benefits: text("benefits"),
  applicationUrl: text("application_url"),
  deadline: timestamp("deadline"),
  location: text("location"),
  isRemote: boolean("is_remote").default(false),
  targetAudience: text("target_audience").array(),
  requiredSkills: text("required_skills").array(),
  preferredSkills: text("preferred_skills").array(),
  experienceLevel: text("experience_level"),
  tags: text("tags").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").unique().notNull(),
  email: text("email").unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  profile: jsonb("profile"),
  analysisResult: jsonb("analysis_result"),
  createdAt: timestamp("created_at").defaultNow(),
  lastVisited: timestamp("last_visited").defaultNow(),
});

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  email: text("email"),
  type: text("type"),
  opportunitySlug: text("opportunity_slug"),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Agent tables
export const agentMissions = pgTable("agent_missions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  goal: text("goal").notNull(),
  status: text("status", {
    enum: ["running", "complete", "failed", "idle"],
  }).notNull().default("running"),
  currentIteration: integer("current_iteration").notNull().default(0),
  preferredTypes: text("preferred_types").array(),
  preferredRegions: text("preferred_regions").array(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentIterations = pgTable("agent_iterations", {
  id: uuid("id").primaryKey().defaultRandom(),
  missionId: uuid("mission_id").notNull().references(() => agentMissions.id),
  iterationNumber: integer("iteration_number").notNull(),
  phase: text("phase", {
    enum: ["perceive", "reason", "plan", "tool_select", "tool_execute", "observe", "memory"],
  }).notNull(),
  reasoning: text("reasoning"),
  toolUsed: text("tool_used"),
  toolParams: jsonb("tool_params"),
  toolResult: jsonb("tool_result"),
  observations: text("observations"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  missionId: uuid("mission_id"),
  memoryType: text("memory_type", {
    enum: ["episodic", "semantic", "procedural"],
  }).notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  importance: doublePrecision("importance").notNull().default(0.5),
  metadata: jsonb("metadata"),
  accessCount: integer("access_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed").defaultNow(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  status: text("status", {
    enum: ["saved", "drafting", "submitted", "accepted", "rejected", "missed"],
  }).notNull().default("saved"),
  documentsGenerated: jsonb("documents_generated"),
  notes: text("notes"),
  deadline: timestamp("deadline"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  type: text("type", {
    enum: ["deadline", "follow_up", "document"],
  }).notNull(),
  message: text("message").notNull(),
  dueAt: timestamp("due_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const importAnalyses = pgTable("import_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  deviceId: text("device_id"),
  sourceUrl: text("source_url"),
  rawText: text("raw_text"),
  status: text("status", {
    enum: ["running", "complete", "failed"],
  }).notNull().default("running"),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  extraction: jsonb("extraction"),
  evaluation: jsonb("evaluation"),
  gapAnalysis: jsonb("gap_analysis"),
  research: jsonb("research"),
  strategy: jsonb("strategy"),
  documents: jsonb("documents"),
  report: jsonb("report"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type AgentMission = typeof agentMissions.$inferSelect;
export type NewAgentMission = typeof agentMissions.$inferInsert;
export type AgentIteration = typeof agentIterations.$inferSelect;
export type NewAgentIteration = typeof agentIterations.$inferInsert;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type ImportAnalysis = typeof importAnalyses.$inferSelect;
export type NewImportAnalysis = typeof importAnalyses.$inferInsert;
