import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().unique(),
  primary_contact: text("primary_contact").notNull(),
  region: text("region").notNull(),
  industry: text("industry").notNull(),
  contract_status: text("contract_status").notNull(),
  annual_spend_usd: integer("annual_spend_usd").notNull(),
  health_score: real("health_score").notNull(),
  risk_flag: text("risk_flag").notNull(),
  client_email: text("client_email").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().references(() => clients.client_id),
  speaker: text("speaker").notNull(), // "Client" or "CSD"
  message: text("message").notNull(),
  scenario_number: integer("scenario_number").notNull(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Ensure unique conversations to prevent duplicates
    unique_conversation: unique().on(table.client_id, table.scenario_number, table.speaker, table.message),
  };
});

export const client_metrics = pgTable("client_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().unique().references(() => clients.client_id),
  avg_response_days: real("avg_response_days").notNull(),
  avg_delivery_days: real("avg_delivery_days").notNull(),
  escalations: integer("escalations").notNull(),
  delivered: integer("delivered").notNull(),
  backlog: integer("backlog").notNull(),
  support_score: integer("support_score").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const client_retention = pgTable("client_retention", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().unique().references(() => clients.client_id),
  renewal_rate_percent: integer("renewal_rate_percent").notNull(),
  policy_lapse_count: integer("policy_lapse_count").notNull(),
  competitor_quotes_requested: integer("competitor_quotes_requested").notNull(),
  risk_score: integer("risk_score").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  created_at: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
});

export const insertClientMetricsSchema = createInsertSchema(client_metrics).omit({
  id: true,
  created_at: true,
});

export const insertClientRetentionSchema = createInsertSchema(client_retention).omit({
  id: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertClientMetrics = z.infer<typeof insertClientMetricsSchema>;
export type ClientMetrics = typeof client_metrics.$inferSelect;
export type InsertClientRetention = z.infer<typeof insertClientRetentionSchema>;
export type ClientRetention = typeof client_retention.$inferSelect;
