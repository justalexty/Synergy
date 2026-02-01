import {
  type Member,
  type InsertMember,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type Event,
  type InsertEvent,
  type ApprovedWallet,
  type InsertApprovedWallet,
  members,
  projects,
  tasks,
  events,
  approvedWallets,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Approved Wallets
  getApprovedWallet(walletAddress: string): Promise<ApprovedWallet | undefined>;
  createApprovedWallet(wallet: InsertApprovedWallet): Promise<ApprovedWallet>;

  // Members
  getMembers(): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByWallet(walletAddress: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member | undefined>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<void>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // Events
  getEvents(start?: Date, end?: Date): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async initialize(): Promise<void> {
    const alexWallet = "0xf391eee70a073e9ed53ebd3b9836644fdfe1b7c6";
    const existing = await this.getApprovedWallet(alexWallet);
    if (!existing) {
      console.log("[storage] Seeding approved wallet for Alex...");
      await this.createApprovedWallet({
        walletAddress: alexWallet,
        userName: "Alex",
      });
      console.log("[storage] Approved wallet seeded successfully");
    }
  }

  // Approved Wallets
  async getApprovedWallet(walletAddress: string): Promise<ApprovedWallet | undefined> {
    const result = await db
      .select()
      .from(approvedWallets)
      .where(eq(approvedWallets.walletAddress, walletAddress.toLowerCase()));
    return result[0];
  }

  async createApprovedWallet(wallet: InsertApprovedWallet): Promise<ApprovedWallet> {
    const result = await db
      .insert(approvedWallets)
      .values({ ...wallet, walletAddress: wallet.walletAddress.toLowerCase() })
      .returning();
    return result[0];
  }

  // Members
  async getMembers(): Promise<Member[]> {
    return db.select().from(members);
  }

  async getMember(id: string): Promise<Member | undefined> {
    const result = await db.select().from(members).where(eq(members.id, id));
    return result[0];
  }

  async getMemberByWallet(walletAddress: string): Promise<Member | undefined> {
    const result = await db
      .select()
      .from(members)
      .where(eq(members.walletAddress, walletAddress.toLowerCase()));
    return result[0];
  }

  async createMember(member: InsertMember): Promise<Member> {
    const result = await db.insert(members).values(member).returning();
    return result[0];
  }

  async updateMember(
    id: string,
    member: Partial<InsertMember>,
  ): Promise<Member | undefined> {
    const result = await db
      .update(members)
      .set(member)
      .where(eq(members.id, id))
      .returning();
    return result[0];
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(project: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(
    id: string,
    project: Partial<InsertProject>,
  ): Promise<Project | undefined> {
    const result = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(
    id: string,
    task: Partial<InsertTask>,
  ): Promise<Task | undefined> {
    const result = await db
      .update(tasks)
      .set(task)
      .where(eq(tasks.id, id))
      .returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Events
  async getEvents(start?: Date, end?: Date): Promise<Event[]> {
    if (start && end) {
      return db
        .select()
        .from(events)
        .where(and(gte(events.start, start), lte(events.start, end)));
    }
    return db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(
    id: string,
    event: Partial<InsertEvent>,
  ): Promise<Event | undefined> {
    const result = await db
      .update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }
}

export const storage = new DbStorage();
