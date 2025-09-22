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

export const emails = pgTable("emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").references(() => clients.client_id),
  email_address: text("email_address").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sender: text("sender").notNull(),
  recipient: text("recipient").notNull(),
  email_date: timestamp("email_date").notNull(),
  message_id: text("message_id").notNull().unique(),
  processed: integer("processed").default(0), // 0 = unprocessed, 1 = processed
  created_at: timestamp("created_at").defaultNow(),
});

export const sentiment_analysis = pgTable("sentiment_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content_id: varchar("content_id").notNull(), // Reference to conversation.id or email.id
  content_type: text("content_type").notNull(), // "conversation" or "email"
  sentiment_score: real("sentiment_score").notNull(), // -1 to 1 scale
  sentiment_label: text("sentiment_label").notNull(), // "positive", "negative", "neutral"
  confidence: real("confidence").notNull(), // 0 to 1 scale
  analysis_method: text("analysis_method").notNull(), // "huggingface" or "openai"
  raw_response: text("raw_response"), // Store full analysis response
  key_phrases: text("key_phrases").array(), // Important phrases/keywords
  cluster_id: integer("cluster_id"), // For clustering analysis
  created_at: timestamp("created_at").defaultNow(),
});

export const file_processing = pgTable("file_processing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  file_path: text("file_path").notNull().unique(),
  file_hash: text("file_hash").notNull(),
  file_type: text("file_type").notNull(), // "txt", "xml", "csv", "excel"
  processed_at: timestamp("processed_at").defaultNow(),
  records_processed: integer("records_processed").default(0),
  status: text("status").notNull().default("completed"), // "processing", "completed", "error"
  error_message: text("error_message"),
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

export const insertEmailSchema = createInsertSchema(emails).omit({
  id: true,
  created_at: true,
});

export const insertSentimentAnalysisSchema = createInsertSchema(sentiment_analysis).omit({
  id: true,
  created_at: true,
});

export const insertFileProcessingSchema = createInsertSchema(file_processing).omit({
  id: true,
  processed_at: true,
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
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;
export type SentimentAnalysis = typeof sentiment_analysis.$inferSelect;
export type InsertFileProcessing = z.infer<typeof insertFileProcessingSchema>;
export type FileProcessing = typeof file_processing.$inferSelect;
