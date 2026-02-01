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
    const existingMembers = await this.getMembers();
    if (existingMembers.length === 0) {
      console.log("[storage] Seeding database with initial data...");
      
      const memberData = [
        { id: "ff016772-4ddc-45e2-b8bc-474f842c7ccb", name: "Vid", handle: "@vid", color: "from-rose-400/40 to-pink-300/40" },
        { id: "213fa7a8-cb4f-49d4-9290-6149445edf49", name: "Joseph", handle: "@joseph", color: "from-red-800/50 to-rose-700/45" },
        { id: "92e2b4dc-b7d6-4896-850a-a9e75c75437f", name: "George", handle: "@george", color: "from-amber-700/40 to-red-600/40" },
        { id: "063cfd21-58a6-4cba-bdb6-ae791eddaee6", name: "Alex", handle: "@alex", color: "from-rose-600/45 to-red-500/40" },
      ];
      await db.insert(members).values(memberData);
      console.log("[storage] Seeded 4 members");

      const projectData = [
        { id: "5b7f80de-6c5c-47a1-8ec3-3e29ac1ecccf", name: "HotStake", emoji: "✦" },
        { id: "20057aec-9f59-4e7b-a958-0d2b5f29aea4", name: "Hex Raffle", emoji: "✧" },
        { id: "7d2247f9-f313-45aa-a30d-deb4983e8e60", name: "Divii", emoji: "▽" },
        { id: "42d4115a-1e08-4224-829d-fd5a16ad3d16", name: "Someday", emoji: "◈" },
        { id: "0d396d59-846f-4146-ae53-d38584f0b248", name: "Fruit", emoji: "☆" },
        { id: "6e77796a-96b8-4b9e-827a-b7f386575d85", name: "EVRO", emoji: "◌" },
        { id: "09a73807-739b-4bca-9435-7b63b60d347d", name: "BaseDollar", emoji: "◌" },
        { id: "b16748de-5bc5-4a6c-b732-93a062f05e00", name: "Orbswap", emoji: "○" },
        { id: "afb1e22c-7290-48ac-94ee-9cb110bfae3b", name: "Nerite", emoji: "△" },
        { id: "904404f8-c636-4881-90fa-2b6009b90ef6", name: "Firm", emoji: "◌" },
      ];
      await db.insert(projects).values(projectData);
      console.log("[storage] Seeded 10 projects");

      const taskData = [
        { id: "5b404494-5eac-42e5-a2df-85c43d17ee1e", title: "Hex Raffle Live", status: "todo", projectId: "20057aec-9f59-4e7b-a958-0d2b5f29aea4", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6", "213fa7a8-cb4f-49d4-9290-6149445edf49"], due: new Date("2026-02-15T06:00:00.000Z"), priority: "High" },
        { id: "ba26186a-34f8-408e-9bfc-1ba83165e59d", title: "Hex Raffle Launch", status: "todo", projectId: "20057aec-9f59-4e7b-a958-0d2b5f29aea4", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6", "213fa7a8-cb4f-49d4-9290-6149445edf49"], due: new Date("2026-02-14T20:00:00.000Z"), priority: "High" },
        { id: "867cf8ab-d72f-4223-b1c0-9a94472b2a20", title: "FM Launch", status: "in_progress", projectId: "0d396d59-846f-4146-ae53-d38584f0b248", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-03T18:00:00.000Z"), priority: "High" },
        { id: "d5f63757-2fc2-4fa0-a3b2-e790791b6c75", title: "Someday Studios Announcement", status: "todo", projectId: "42d4115a-1e08-4224-829d-fd5a16ad3d16", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6", "213fa7a8-cb4f-49d4-9290-6149445edf49"], due: new Date("2026-02-24T17:00:00.000Z"), priority: "High" },
        { id: "78abbf84-a9b9-41be-831e-d09d9ecea034", title: "Someday Studios Trailer", status: "todo", projectId: "42d4115a-1e08-4224-829d-fd5a16ad3d16", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-23T23:00:00.000Z"), priority: "High" },
        { id: "0e41571e-48ed-4b90-af29-a9b26c38be21", title: "Someday Studios Socials", status: "todo", projectId: "42d4115a-1e08-4224-829d-fd5a16ad3d16", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-22T22:00:00.000Z"), priority: "Medium" },
        { id: "c8532fea-009a-494e-84d6-2094004277b4", title: "HotStake Launch", status: "in_progress", projectId: "5b7f80de-6c5c-47a1-8ec3-3e29ac1ecccf", assigneeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-10T17:00:00.000Z"), priority: "High" },
        { id: "0b25952f-3f2a-4317-83c3-4eb142058305", title: "Promo", status: "", projectId: null, assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-05T18:00:00.000Z"), priority: "" },
        { id: "8cf038c4-0d00-4358-9cee-5b2dbae94be2", title: "Promo", status: "", projectId: null, assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-12T18:00:00.000Z"), priority: "" },
        { id: "e437fc61-fc7f-49b1-b068-be30bebc7f2c", title: "Promo", status: "", projectId: null, assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-19T18:00:00.000Z"), priority: "" },
        { id: "06298412-f0ce-456f-97e5-b2c7c7c014bc", title: "Promo", status: "", projectId: null, assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6"], due: new Date("2026-02-26T18:00:00.000Z"), priority: "" },
        { id: "767bafa8-d3a9-4f76-b405-de79f9935dcc", title: "Snail Mail Campaign", status: "", projectId: "afb1e22c-7290-48ac-94ee-9cb110bfae3b", assigneeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49"], due: null, priority: "" },
        { id: "78bd4639-83b5-41d1-9569-f4bd3c200f4a", title: "Divii Launch (SG?)", status: "in_progress", projectId: "7d2247f9-f313-45aa-a30d-deb4983e8e60", assigneeIds: ["063cfd21-58a6-4cba-bdb6-ae791eddaee6", "213fa7a8-cb4f-49d4-9290-6149445edf49"], due: new Date("2026-02-17T17:00:00.000Z"), priority: "Low" },
      ];
      await db.insert(tasks).values(taskData);
      console.log("[storage] Seeded 13 tasks");

      const eventData = [
        { id: "5e4e6091-780f-463e-b577-ab510388d2bb", title: "Standup 20m", start: new Date("2026-02-02T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "23a1f6e9-0190-47c7-aa3c-5a7213645b0e", title: "Standup 10m", start: new Date("2026-02-04T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "5ffc0774-992e-4b26-af5c-281483a61139", title: "Standup 20m", start: new Date("2026-02-09T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "2bb781d8-884a-49fc-9f66-07cac1cba456", title: "Standup 20m", start: new Date("2026-02-16T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "69f3860f-57a2-4ce3-bdf9-5c133cd07daf", title: "Standup 20m", start: new Date("2026-02-23T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "f115528c-ac97-42e5-a7a2-6f18122d6458", title: "Standup 10m", start: new Date("2026-02-11T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "3b0310af-d098-46b1-b1e3-e2070dbd579d", title: "Standup 10m", start: new Date("2026-02-18T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "f2fb6e40-84c8-4614-8a24-4ee8117832b7", title: "Standup 10m", start: new Date("2026-02-25T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "e4f929e5-b725-4628-8bf4-5c4f7528cdbd", title: "Standup 10m", start: new Date("2026-02-06T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "a1b4696e-2450-4e0d-b334-59a7717bed77", title: "Standup 10m", start: new Date("2026-02-13T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "7b06ab97-0f0a-40d8-bd0a-043308b11202", title: "Standup 10m", start: new Date("2026-02-20T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
        { id: "231b1cc4-7b59-4721-a989-e1464b107800", title: "Standup 10m", start: new Date("2026-02-27T17:00:00.000Z"), color: "primary", attendeeIds: ["213fa7a8-cb4f-49d4-9290-6149445edf49", "063cfd21-58a6-4cba-bdb6-ae791eddaee6"] },
      ];
      await db.insert(events).values(eventData);
      console.log("[storage] Seeded 12 events");

      console.log("[storage] Database seeding complete");
    }

    const alexWallet = "0xf391eee70a073e9ed53ebd3b9836644fdfe1b7c6";
    const existingWallet = await this.getApprovedWallet(alexWallet);
    if (!existingWallet) {
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
