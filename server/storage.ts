import { 
  users, clients, conversations, client_metrics, client_retention,
  type User, type InsertUser, type Client, type InsertClient, 
  type Conversation, type InsertConversation, type ClientMetrics, type InsertClientMetrics,
  type ClientRetention, type InsertClientRetention
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  createClient(client: InsertClient): Promise<Client | undefined>;
  getClient(clientId: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation | undefined>;
  getConversationsByClient(clientId: string): Promise<Conversation[]>;
  
  // Client metrics methods
  createClientMetrics(metrics: InsertClientMetrics): Promise<ClientMetrics | undefined>;
  getClientMetrics(clientId: string): Promise<ClientMetrics | undefined>;
  
  // Client retention methods
  createClientRetention(retention: InsertClientRetention): Promise<ClientRetention | undefined>;
  getClientRetention(clientId: string): Promise<ClientRetention | undefined>;
  
  // Dashboard analytics methods
  getDashboardMetrics(): Promise<{
    totalClients: number;
    atRiskClients: number;
    avgRiskScore: number;
    churnRate: number;
  }>;
  getAtRiskClientsList(): Promise<Array<{
    id: string;
    name: string;
    riskScore: number;
    industry: string;
    healthScore: number;
  }>>;
  
  // Client benchmarking methods
  getClientBenchmarkingData(): Promise<Array<{
    client: string;
    nps: number;
    retention: number;
    supportScore: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Client methods
  async createClient(client: InsertClient): Promise<Client | undefined> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .onConflictDoNothing({ target: clients.client_id })
      .returning();
    return newClient || undefined;
  }

  async getClient(clientId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.client_id, clientId));
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }
  
  // Conversation methods
  async createConversation(conversation: InsertConversation): Promise<Conversation | undefined> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .onConflictDoNothing()
      .returning();
    return newConversation || undefined;
  }

  async getConversationsByClient(clientId: string): Promise<Conversation[]> {
    return await db.select().from(conversations).where(eq(conversations.client_id, clientId));
  }
  
  // Client metrics methods
  async createClientMetrics(metrics: InsertClientMetrics): Promise<ClientMetrics | undefined> {
    const [newMetrics] = await db
      .insert(client_metrics)
      .values(metrics)
      .onConflictDoNothing({ target: client_metrics.client_id })
      .returning();
    return newMetrics || undefined;
  }

  async getClientMetrics(clientId: string): Promise<ClientMetrics | undefined> {
    const [metrics] = await db.select().from(client_metrics).where(eq(client_metrics.client_id, clientId));
    return metrics || undefined;
  }
  
  // Client retention methods
  async createClientRetention(retention: InsertClientRetention): Promise<ClientRetention | undefined> {
    const [newRetention] = await db
      .insert(client_retention)
      .values(retention)
      .onConflictDoNothing({ target: client_retention.client_id })
      .returning();
    return newRetention || undefined;
  }

  async getClientRetention(clientId: string): Promise<ClientRetention | undefined> {
    const [retention] = await db.select().from(client_retention).where(eq(client_retention.client_id, clientId));
    return retention || undefined;
  }
  
  // Dashboard analytics methods
  async getDashboardMetrics(): Promise<{
    totalClients: number;
    atRiskClients: number;
    avgRiskScore: number;
    churnRate: number;
  }> {
    // Get total clients count
    const totalClientsResult = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const totalClients = totalClientsResult[0]?.count || 0;
    
    // Get at-risk clients count (risk_flag = 'High' or health_score < 5)
    const atRiskResult = await db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(sql`risk_flag = 'High' OR health_score < 5`);
    const atRiskClients = atRiskResult[0]?.count || 0;
    
    // Get average risk score from client_retention table
    const avgRiskResult = await db.select({ avg: sql<number>`avg(risk_score)` }).from(client_retention);
    const avgRiskScore = Number(avgRiskResult[0]?.avg) || 0;
    
    // Calculate churn rate (100 - average renewal rate)
    const avgRenewalResult = await db.select({ avg: sql<number>`avg(renewal_rate_percent)` }).from(client_retention);
    const avgRenewalRate = Number(avgRenewalResult[0]?.avg) || 0;
    const churnRate = Math.max(0, 100 - avgRenewalRate);
    
    return {
      totalClients,
      atRiskClients,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10, // Round to 1 decimal
      churnRate: Math.round(churnRate * 10) / 10 // Round to 1 decimal
    };
  }

  async getAtRiskClientsList(): Promise<Array<{
    id: string;
    name: string;
    riskScore: number;
    industry: string;
    healthScore: number;
  }>> {
    const atRiskClients = await db
      .select({
        id: clients.client_id,
        name: clients.primary_contact,
        industry: clients.industry,
        healthScore: clients.health_score,
        riskScore: client_retention.risk_score
      })
      .from(clients)
      .leftJoin(client_retention, eq(clients.client_id, client_retention.client_id))
      .where(sql`clients.risk_flag = 'High' OR clients.health_score < 5`)
      .orderBy(sql`client_retention.risk_score DESC`);
    
    return atRiskClients.map(client => ({
      id: client.id,
      name: client.name,
      riskScore: client.riskScore || 0,
      industry: client.industry,
      healthScore: client.healthScore
    }));
  }

  async getClientBenchmarkingData(): Promise<Array<{
    client: string;
    nps: number;
    retention: number;
    supportScore: number;
  }>> {
    const benchmarkingClients = await db
      .select({
        clientId: clients.client_id,
        primaryContact: clients.primary_contact,
        healthScore: clients.health_score,
        renewalRate: client_retention.renewal_rate_percent,
        supportScore: client_metrics.support_score
      })
      .from(clients)
      .leftJoin(client_metrics, eq(clients.client_id, client_metrics.client_id))
      .leftJoin(client_retention, eq(clients.client_id, client_retention.client_id))
      .orderBy(clients.client_id);
    
    return benchmarkingClients.map(client => ({
      client: client.clientId, // Using client_id as the identifier
      nps: Math.round(client.healthScore * 10) || 0, // Map health_score to nps, scale it up and round
      retention: client.renewalRate || 0, // Map renewal_rate_percent to retention
      supportScore: client.supportScore || 0 // Map support_score directly
    }));
  }
}

export const storage = new DatabaseStorage();
