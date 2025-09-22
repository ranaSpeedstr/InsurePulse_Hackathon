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

// Alerts and notifications tables for smart trigger system
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().references(() => clients.client_id),
  client_name: text("client_name").notNull(),
  client_email: text("client_email").notNull(),
  trigger_type: text("trigger_type").notNull(), // "NPS_DROP", "HIGH_CHURN_RISK", "NEGATIVE_FEEDBACK", etc.
  trigger_description: text("trigger_description").notNull(),
  severity: text("severity").notNull().default("Medium"), // "Low", "Medium", "High", "Critical"
  status: text("status").notNull().default("Pending"), // "Pending", "Acknowledged", "Resolved"
  detected_at: timestamp("detected_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
  openai_analysis: text("openai_analysis"), // Store full OpenAI analysis
  csv_data_snapshot: text("csv_data_snapshot"), // Store relevant CSV data when trigger was created
  created_at: timestamp("created_at").defaultNow(),
});

export const email_notifications = pgTable("email_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alert_id: varchar("alert_id").notNull().references(() => alerts.id),
  subject: text("subject").notNull(),
  recipient_email: text("recipient_email").notNull(),
  sender_email: text("sender_email").notNull().default("csdinsure@gmail.com"),
  email_body: text("email_body").notNull(),
  status: text("status").notNull().default("Sent"), // "Sent", "Failed", "Pending"
  sent_at: timestamp("sent_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
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
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  created_at: true,
});

export const insertEmailNotificationSchema = createInsertSchema(email_notifications).omit({
  id: true,
  created_at: true,
});

// Time-series data tables for forecasting
export const client_time_series = pgTable("client_time_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().references(() => clients.client_id),
  date: timestamp("date").notNull(),
  sentiment_score: real("sentiment_score"), // Daily/weekly sentiment average
  churn_probability: real("churn_probability"), // Churn risk percentage
  satisfaction_score: real("satisfaction_score"), // Customer satisfaction score
  issue_count: integer("issue_count").default(0), // Number of issues/tickets
  escalation_count: integer("escalation_count").default(0), // Number of escalations
  response_time_hours: real("response_time_hours"), // Average response time
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Ensure unique date per client
    unique_client_date: unique().on(table.client_id, table.date),
  };
});

export const forecast_predictions = pgTable("forecast_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  client_id: varchar("client_id").notNull().references(() => clients.client_id),
  forecast_type: text("forecast_type").notNull(), // "sentiment" or "churn_risk"
  forecast_date: timestamp("forecast_date").notNull(), // Date this forecast is for
  predicted_value: real("predicted_value").notNull(), // Predicted sentiment or churn %
  confidence_score: real("confidence_score"), // Confidence in prediction (0-1)
  openai_analysis: text("openai_analysis"), // AI interpretation/insights
  data_points_used: integer("data_points_used"), // Number of historical points used
  created_at: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    // Ensure unique forecast per client/type/date
    unique_forecast: unique().on(table.client_id, table.forecast_type, table.forecast_date),
  };
});

export const insertClientTimeSeriesSchema = createInsertSchema(client_time_series).omit({
  id: true,
  created_at: true,
});

export const insertForecastPredictionSchema = createInsertSchema(forecast_predictions).omit({
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
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails.$inferSelect;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;
export type SentimentAnalysis = typeof sentiment_analysis.$inferSelect;
export type InsertFileProcessing = z.infer<typeof insertFileProcessingSchema>;
export type FileProcessing = typeof file_processing.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof email_notifications.$inferSelect;
export type InsertClientTimeSeries = z.infer<typeof insertClientTimeSeriesSchema>;
export type ClientTimeSeries = typeof client_time_series.$inferSelect;
export type InsertForecastPrediction = z.infer<typeof insertForecastPredictionSchema>;
export type ForecastPrediction = typeof forecast_predictions.$inferSelect;
