import { useMemo, useState } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletConnectButton from "@/components/walletconnect-button";
import { cn } from "@/lib/utils";

type Status = "todo" | "in_progress" | "blocked" | "done";

type Member = {
  id: string;
  name: string;
  handle: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
  emoji: string;
};

type Task = {
  id: string;
  title: string;
  status: Status;
  projectId: string;
  assigneeIds: string[];
  due: Date | null;
  priority: "Low" | "Medium" | "High";
};

type Event = {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  color: "primary" | "accent" | "muted";
  attendees: string[];
};

const members: Member[] = [
  {
    id: "m1",
    name: "Ava Park",
    handle: "@ava",
    color: "from-violet-500/20 to-indigo-500/20",
  },
  {
    id: "m2",
    name: "Noah Kim",
    handle: "@noah",
    color: "from-cyan-500/18 to-sky-500/18",
  },
  {
    id: "m3",
    name: "Mina Chen",
    handle: "@mina",
    color: "from-emerald-500/18 to-lime-500/18",
  },
  {
    id: "m4",
    name: "Omar Ali",
    handle: "@omar",
    color: "from-fuchsia-500/18 to-pink-500/18",
  },
];

const projects: Project[] = [
  { id: "p1", name: "Website Revamp", emoji: "✦" },
  { id: "p2", name: "Mobile App", emoji: "◈" },
  { id: "p3", name: "Ops & Hiring", emoji: "◌" },
];

const statusLabel: Record<Status, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

function statusClass(s: Status) {
  switch (s) {
    case "todo":
      return "bg-muted text-muted-foreground border-border";
    case "in_progress":
      return "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.25)]";
    case "blocked":
      return "bg-[hsl(var(--destructive)/0.10)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.25)]";
    case "done":
      return "bg-[hsl(var(--accent)/0.14)] text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.25)]";
  }
}

function priorityClass(p: Task["priority"]) {
  switch (p) {
    case "Low":
      return "bg-muted text-muted-foreground border-border";
    case "Medium":
      return "bg-[hsl(var(--chart-4)/0.18)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/0.30)]";
    case "High":
      return "bg-[hsl(var(--destructive)/0.10)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.25)]";
  }
}

function membersById() {
  return new Map(members.map((m) => [m.id, m] as const));
}

const initialTasks: Task[] = [
  {
    id: "t1",
    title: "Finalize IA + nav structure",
    status: "in_progress",
    projectId: "p1",
    assigneeIds: ["m1", "m2"],
    due: addDays(new Date(), 3),
    priority: "High",
  },
  {
    id: "t2",
    title: "Write spec for recurring events",
    status: "todo",
    projectId: "p2",
    assigneeIds: ["m3"],
    due: addDays(new Date(), 7),
    priority: "Medium",
  },
  {
    id: "t3",
    title: "Hiring pipeline: stage definitions",
    status: "todo",
    projectId: "p3",
    assigneeIds: ["m4"],
    due: addDays(new Date(), 10),
    priority: "Low",
  },
  {
    id: "t4",
    title: "QA: calendar drag interactions",
    status: "blocked",
    projectId: "p2",
    assigneeIds: ["m2"],
    due: addDays(new Date(), 5),
    priority: "High",
  },
  {
    id: "t5",
    title: "Design tokens pass",
    status: "done",
    projectId: "p1",
    assigneeIds: ["m1", "m3"],
    due: addDays(new Date(), -2),
    priority: "Medium",
  },
];

const initialEvents: Event[] = [
  {
    id: "e1",
    title: "Weekly planning",
    start: addDays(new Date(), 1),
    color: "primary",
    attendees: ["m1", "m2", "m3"],
  },
  {
    id: "e2",
    title: "Design review",
    start: addDays(new Date(), 2),
    color: "accent",
    attendees: ["m1", "m4"],
  },
  {
    id: "e3",
    title: "Ship v0 notes",
    start: addDays(new Date(), 4),
    color: "muted",
    attendees: ["m2"],
  },
];

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-grid opacity-[0.55]" />
      <div className="absolute inset-0 bg-radial" />
      <div className="absolute inset-0 bg-radial-2" />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function TopBar({
  query,
  setQuery,
  onCreate,
}: {
  query: string;
  setQuery: (v: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl border bg-card/70 shadow-soft neon-ring"
              data-testid="badge-brand"
            >
              <Sparkles
                className="h-4 w-4 text-[hsl(var(--primary))] text-neon"
                strokeWidth={2.4}
              />
            </div>
            <div className="min-w-0">
              <div
                className="font-display text-[18px] font-[720] tracking-[-0.02em]"
                data-testid="text-app-title"
              >
                Synergy
              </div>
              <div
                className="text-xs text-muted-foreground"
                data-testid="text-app-subtitle"
              >
                Team workflow + calendar workspace
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WalletConnectButton onConnected={() => {}} />
          <Button
            variant="secondary"
            className="hidden sm:inline-flex"
            data-testid="button-filter"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            className="shadow-soft neon-ring"
            onClick={onCreate}
            data-testid="button-create"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <div className="glass shadow-soft flex items-center gap-2 rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, docs, events…"
            className="border-0 bg-transparent px-0 focus-visible:ring-0"
            data-testid="input-search"
          />
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border bg-card/70 px-3 py-2 shadow-soft">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm" data-testid="text-team-name">
              Studio Team
            </div>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className={cn(
                  "h-7 w-7 rounded-full border bg-gradient-to-br",
                  m.color,
                )}
                title={m.name}
                data-testid={`img-avatar-${m.id}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftRail({
  active,
  setActive,
}: {
  active: "overview" | "calendar" | "tasks";
  setActive: (v: "overview" | "calendar" | "tasks") => void;
}) {
  return (
    <div className="glass shadow-soft sticky top-6 hidden h-[calc(100vh-3.5rem)] w-[240px] flex-col rounded-2xl p-3 lg:flex">
      <div className="mb-2 px-2 pt-2">
        <div className="text-xs font-medium text-muted-foreground">Workspace</div>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          variant={active === "overview" ? "default" : "ghost"}
          className={cn(
            "justify-start",
            active === "overview" ? "shadow-soft" : "",
          )}
          onClick={() => setActive("overview")}
          data-testid="button-nav-overview"
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Overview
        </Button>
        <Button
          variant={active === "calendar" ? "default" : "ghost"}
          className={cn(
            "justify-start",
            active === "calendar" ? "shadow-soft" : "",
          )}
          onClick={() => setActive("calendar")}
          data-testid="button-nav-calendar"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Calendar
        </Button>
        <Button
          variant={active === "tasks" ? "default" : "ghost"}
          className={cn(
            "justify-start",
            active === "tasks" ? "shadow-soft" : "",
          )}
          onClick={() => setActive("tasks")}
          data-testid="button-nav-tasks"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Tasks
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="px-2">
        <div className="text-xs font-medium text-muted-foreground">Projects</div>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-[hsl(var(--foreground)/0.03)]"
            data-testid={`row-project-${p.id}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="grid h-7 w-7 place-items-center rounded-lg border bg-card/70"
                data-testid={`badge-project-${p.id}`}
              >
                <span className="text-sm" aria-hidden>
                  {p.emoji}
                </span>
              </div>
              <div className="text-sm" data-testid={`text-project-${p.id}`}>
                {p.name}
              </div>
            </div>
            <Badge variant="secondary" data-testid={`badge-count-${p.id}`}>
              {Math.floor(2 + Math.random() * 7)}
            </Badge>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-xl border bg-card/70 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium" data-testid="text-upgrade-title">
              Free workspace
            </div>
            <div
              className="text-xs text-muted-foreground"
              data-testid="text-upgrade-subtitle"
            >
              Invite up to 5 teammates
            </div>
          </div>
          <Button size="sm" variant="secondary" data-testid="button-upgrade">
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="glass shadow-soft rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground" data-testid={`text-metric-${label}`}>
          {label}
        </div>
        <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary)/0.45)]" />
      </div>
      <div
        className="mt-2 font-display text-3xl font-[720] tracking-[-0.03em]"
        data-testid={`value-metric-${label}`}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-muted-foreground" data-testid={`hint-metric-${label}`}>
        {hint}
      </div>
    </Card>
  );
}

function TaskRow({
  t,
  membersMap,
}: {
  t: Task;
  membersMap: Map<string, Member>;
}) {
  const p = projects.find((x) => x.id === t.projectId);
  return (
    <div
      className="group flex items-center justify-between gap-4 rounded-xl border bg-card/70 px-3 py-3 shadow-soft transition hover:-translate-y-[1px] hover:shadow-float"
      data-testid={`row-task-${t.id}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs",
              statusClass(t.status),
            )}
            data-testid={`badge-status-${t.id}`}
          >
            {statusLabel[t.status]}
          </div>
          <div
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs",
              priorityClass(t.priority),
            )}
            data-testid={`badge-priority-${t.id}`}
          >
            {t.priority}
          </div>
          <div
            className="hidden text-xs text-muted-foreground sm:block"
            data-testid={`text-projectname-${t.id}`}
          >
            {p?.name}
          </div>
        </div>

        <div
          className="mt-1 truncate text-sm font-medium"
          data-testid={`text-tasktitle-${t.id}`}
        >
          {t.title}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-xs text-muted-foreground md:block" data-testid={`text-due-${t.id}`}>
          {t.due ? format(t.due, "MMM d") : "—"}
        </div>
        <div className="flex -space-x-2">
          {t.assigneeIds.map((id) => {
            const m = membersMap.get(id);
            if (!m) return null;
            return (
              <div
                key={id}
                className={cn("h-7 w-7 rounded-full border bg-gradient-to-br", m.color)}
                title={m.name}
                data-testid={`img-taskassignee-${t.id}-${id}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  selected,
  onSelect,
  events,
}: {
  month: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  events: Event[];
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }

  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) {
      const k = format(e.start, "yyyy-MM-dd");
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  return (
    <div className="rounded-2xl border bg-card/70 p-3 shadow-soft">
      <div className="grid grid-cols-7 gap-2 pb-2 text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => (
          <div key={x} className="px-2" data-testid={`text-weekday-${x}`}>
            {x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const isSel = isSameDay(day, selected);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "group relative flex min-h-[88px] flex-col rounded-xl border px-2 py-2 text-left transition",
                "hover:-translate-y-[1px] hover:shadow-float",
                inMonth ? "bg-card/60" : "bg-card/30 opacity-70",
                isSel ? "border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.08)]" : "border-border",
              )}
              data-testid={`button-day-${key}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "text-xs",
                    isToday(day) ? "text-[hsl(var(--primary))]" : "text-muted-foreground",
                  )}
                  data-testid={`text-daynum-${key}`}
                >
                  {format(day, "d")}
                </div>
                {dayEvents.length > 0 ? (
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] opacity-80"
                    data-testid={`status-dayhasitems-${key}`}
                  />
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      "truncate rounded-md px-2 py-1 text-[11px]",
                      e.color === "primary"
                        ? "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
                        : e.color === "accent"
                          ? "bg-[hsl(var(--accent)/0.14)] text-[hsl(var(--accent))]"
                          : "bg-muted text-muted-foreground",
                    )}
                    data-testid={`pill-event-${e.id}`}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className="text-[11px] text-muted-foreground" data-testid={`text-more-${key}`}>
                    +{dayEvents.length - 2} more
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayAgenda({ selected, tasks, events }: { selected: Date; tasks: Task[]; events: Event[] }) {
  const tasksForDay = tasks
    .filter((t) => t.due && isSameDay(t.due, selected))
    .slice(0, 6);

  const eventsForDay = events
    .filter((e) => isSameDay(e.start, selected))
    .slice(0, 6);

  return (
    <Card className="glass shadow-soft rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium" data-testid="text-agenda-title">
            Agenda
          </div>
          <div className="text-xs text-muted-foreground" data-testid="text-agenda-subtitle">
            {format(selected, "EEEE, MMM d")}
          </div>
        </div>
        <Button size="sm" variant="secondary" data-testid="button-add-agenda">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        {eventsForDay.length === 0 && tasksForDay.length === 0 ? (
          <div className="rounded-xl border bg-card/60 p-3 text-sm text-muted-foreground" data-testid="empty-agenda">
            Nothing scheduled. Pick a day with tasks/events or create one.
          </div>
        ) : null}

        {eventsForDay.map((e) => (
          <div
            key={e.id}
            className="flex items-center justify-between rounded-xl border bg-card/60 px-3 py-2"
            data-testid={`row-event-${e.id}`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium" data-testid={`text-eventtitle-${e.id}`}>
                {e.title}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-eventmeta-${e.id}`}>
                {e.attendees.length} attendee{e.attendees.length === 1 ? "" : "s"}
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                e.color === "primary"
                  ? "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
                  : e.color === "accent"
                    ? "bg-[hsl(var(--accent)/0.14)] text-[hsl(var(--accent))]"
                    : "bg-muted text-muted-foreground",
              )}
              data-testid={`badge-eventcolor-${e.id}`}
            >
              {e.color}
            </Badge>
          </div>
        ))}

        {tasksForDay.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl border bg-card/60 px-3 py-2"
            data-testid={`row-agendatask-${t.id}`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium" data-testid={`text-agendatasktitle-${t.id}`}>
                {t.title}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-agendataskmeta-${t.id}`}>
                {statusLabel[t.status]} • {t.priority}
              </div>
            </div>
            <div className={cn("rounded-md border px-2 py-0.5 text-xs", statusClass(t.status))} data-testid={`badge-agendastatus-${t.id}`}>
              {statusLabel[t.status]}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function WorkspacePage() {
  const [active, setActive] = useState<"overview" | "calendar" | "tasks">(
    "overview",
  );
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [tasks, setTasks] = useState<Task[]>(() => initialTasks);
  const [events, setEvents] = useState<Event[]>(() => initialEvents);

  const membersMap = useMemo(() => membersById(), []);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const p = projects.find((x) => x.id === t.projectId)?.name ?? "";
      return (
        t.title.toLowerCase().includes(q) ||
        statusLabel[t.status].toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        p.toLowerCase().includes(q)
      );
    });
  }, [query, tasks]);

  function onCreate() {
    const id = `t${Math.floor(1000 + Math.random() * 9000)}`;
    const newTask: Task = {
      id,
      title: "New task (draft)",
      status: "todo",
      projectId: projects[0].id,
      assigneeIds: [members[0].id],
      due: selected,
      priority: "Medium",
    };
    setTasks((prev) => [newTask, ...prev]);
  }

  function addQuickEvent() {
    const id = `e${Math.floor(1000 + Math.random() * 9000)}`;
    const e: Event = {
      id,
      title: "New event",
      start: selected,
      color: "primary",
      attendees: [members[0].id, members[1].id],
    };
    setEvents((prev) => [e, ...prev]);
  }

  return (
    <AppShell>
      <TopBar query={query} setQuery={setQuery} onCreate={onCreate} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <LeftRail active={active} setActive={setActive} />

        <div className="min-w-0">
          <Tabs
            value={active}
            onValueChange={(v) => setActive(v as any)}
            className="lg:hidden"
          >
            <TabsList className="grid w-full grid-cols-3" data-testid="tabs-mobile">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="calendar" data-testid="tab-calendar">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="tasks" data-testid="tab-tasks">
                Tasks
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {active === "overview" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <MetricCard label="This week" value="12" hint="items scheduled" />
                  <MetricCard label="In progress" value="4" hint="tasks moving" />
                  <MetricCard label="Focus" value="2" hint="projects active" />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
                  <Card className="glass shadow-soft rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" data-testid="text-recents-title">
                          Recent tasks
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="text-recents-subtitle">
                          A quick pulse across the team
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" data-testid="button-viewall">
                        View all
                      </Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      {filteredTasks.slice(0, 5).map((t) => (
                        <TaskRow key={t.id} t={t} membersMap={membersMap} />
                      ))}
                    </div>
                  </Card>

                  <DayAgenda selected={selected} tasks={tasks} events={events} />
                </div>
              </div>
            ) : null}

            {active === "calendar" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-display text-2xl font-[720] tracking-[-0.03em]" data-testid="text-calendar-title">
                      {format(month, "MMMM yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-calendar-subtitle">
                      Click a day to see agenda. Create adds a task due that day.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setMonth((m) => subMonths(m, 1))}
                      data-testid="button-prev-month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setMonth((m) => addMonths(m, 1))}
                      data-testid="button-next-month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setMonth(new Date());
                        setSelected(new Date());
                      }}
                      data-testid="button-today"
                    >
                      Today
                    </Button>
                    <Button
                      className="shadow-soft"
                      onClick={addQuickEvent}
                      data-testid="button-add-event"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Event
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
                  <MonthGrid
                    month={month}
                    selected={selected}
                    onSelect={setSelected}
                    events={events}
                  />
                  <DayAgenda selected={selected} tasks={tasks} events={events} />
                </div>
              </div>
            ) : null}

            {active === "tasks" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border bg-card/70 p-4 shadow-soft">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-display text-2xl font-[720] tracking-[-0.03em]" data-testid="text-tasks-title">
                        Tasks
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="text-tasks-subtitle">
                        Lightweight list view (mock data)
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        data-testid="button-sort"
                      >
                        Sort
                      </Button>
                      <Button
                        className="shadow-soft"
                        onClick={onCreate}
                        data-testid="button-add-task"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Task
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredTasks.map((t) => (
                    <TaskRow key={t.id} t={t} membersMap={membersMap} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
