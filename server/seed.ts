import { db } from "./db";
import { members, projects, tasks, events } from "@shared/schema";
import { addDays } from "date-fns";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(events);
  await db.delete(tasks);
  await db.delete(projects);
  await db.delete(members);

  // Seed members
  const [m1, m2, m3, m4] = await db
    .insert(members)
    .values([
      {
        name: "Ava Park",
        handle: "@ava",
        color: "from-rose-400/40 to-pink-300/40",
      },
      {
        name: "Noah Kim",
        handle: "@noah",
        color: "from-red-800/50 to-rose-700/45",
      },
      {
        name: "Mina Chen",
        handle: "@mina",
        color: "from-amber-700/40 to-red-600/40",
      },
      {
        name: "Omar Ali",
        handle: "@omar",
        color: "from-rose-600/45 to-red-500/40",
      },
    ])
    .returning();

  // Seed projects
  const [p1, p2, p3] = await db
    .insert(projects)
    .values([
      { name: "Website Revamp", emoji: "✦" },
      { name: "Mobile App", emoji: "◈" },
      { name: "Ops & Hiring", emoji: "◌" },
    ])
    .returning();

  // Seed tasks
  await db.insert(tasks).values([
    {
      title: "Finalize IA + nav structure",
      status: "in_progress",
      projectId: p1.id,
      assigneeIds: [m1.id, m2.id],
      due: addDays(new Date(), 3),
      priority: "High",
    },
    {
      title: "Write spec for recurring events",
      status: "todo",
      projectId: p2.id,
      assigneeIds: [m3.id],
      due: addDays(new Date(), 7),
      priority: "Medium",
    },
    {
      title: "Hiring pipeline: stage definitions",
      status: "todo",
      projectId: p3.id,
      assigneeIds: [m4.id],
      due: addDays(new Date(), 10),
      priority: "Low",
    },
    {
      title: "QA: calendar drag interactions",
      status: "blocked",
      projectId: p2.id,
      assigneeIds: [m2.id],
      due: addDays(new Date(), 5),
      priority: "High",
    },
    {
      title: "Design tokens pass",
      status: "done",
      projectId: p1.id,
      assigneeIds: [m1.id, m3.id],
      due: addDays(new Date(), -2),
      priority: "Medium",
    },
  ]);

  // Seed events
  await db.insert(events).values([
    {
      title: "Weekly planning",
      start: addDays(new Date(), 1),
      color: "primary",
      attendeeIds: [m1.id, m2.id, m3.id],
    },
    {
      title: "Design review",
      start: addDays(new Date(), 2),
      color: "accent",
      attendeeIds: [m1.id, m4.id],
    },
    {
      title: "Ship v0 notes",
      start: addDays(new Date(), 4),
      color: "muted",
      attendeeIds: [m2.id],
    },
  ]);

  console.log("Database seeded successfully!");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
