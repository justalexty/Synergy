import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const approvedWallets = pgTable("approved_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  userName: text("user_name").notNull(),
});

export const insertApprovedWalletSchema = createInsertSchema(approvedWallets).omit({ id: true });
export type InsertApprovedWallet = z.infer<typeof insertApprovedWalletSchema>;
export type ApprovedWallet = typeof approvedWallets.$inferSelect;

export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").unique(),
  name: text("name").notNull(),
  handle: text("handle").notNull(),
  color: text("color").notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true });
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "set null" }),
  assigneeIds: text("assignee_ids").array().notNull().default(sql`'{}'::text[]`),
  due: timestamp("due"),
  priority: text("priority").notNull().default("Medium"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true }).extend({
  due: z.coerce.date().nullable(),
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end"),
  color: text("color").notNull().default("primary"),
  attendeeIds: text("attendee_ids").array().notNull().default(sql`'{}'::text[]`),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true }).extend({
  start: z.coerce.date(),
  end: z.coerce.date().nullable(),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
