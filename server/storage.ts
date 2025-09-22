import { 
  users, clients, conversations, client_metrics, client_retention,
  type User, type InsertUser, type Client, type InsertClient, 
  type Conversation, type InsertConversation, type ClientMetrics, type InsertClientMetrics,
  type ClientRetention, type InsertClientRetention
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
