import { useMemo, useState } from "react";

const _memberColorSafelist = [
  "from-rose-400/40", "to-pink-300/40",
  "from-red-800/50", "to-rose-700/45",
  "from-amber-700/40", "to-red-600/40",
  "from-rose-600/45", "to-red-500/40",
];
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Handshake,
  LayoutGrid,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import WalletConnectButton from "@/components/walletconnect-button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Member, Project, Task, Event } from "@shared/schema";

type Status = "todo" | "in_progress" | "blocked" | "done";

const statusLabel: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

function statusClass(s: Status) {
  switch (s) {
    case "todo":
      return "bg-[hsl(35_20%_88%)] text-[hsl(25_30%_40%)] border-[hsl(30_20%_75%)]";
    case "in_progress":
      return "bg-[hsl(300_45%_92%)] text-[hsl(305_50%_38%)] border-[hsl(300_40%_78%)]";
    case "blocked":
      return "bg-[hsl(355_60%_92%)] text-[hsl(355_55%_45%)] border-[hsl(355_50%_78%)]";
    case "done":
      return "bg-[hsl(24_45%_82%)] text-[hsl(20_55%_28%)] border-[hsl(22_40%_62%)]";
  }
}

function priorityClass(p: string) {
  switch (p) {
    case "Low":
      return "bg-[hsl(285_35%_88%)] text-[hsl(290_45%_32%)] border-[hsl(285_30%_72%)]";
    case "Medium":
      return "bg-[hsl(45_55%_91%)] text-[hsl(40_50%_38%)] border-[hsl(43_45%_78%)]";
    case "High":
      return "bg-[hsl(355_45%_95%)] text-[#ff7d8f] border-[hsl(354_35%_85%)]";
  }
}

const EMOJI_OPTIONS = ["✦", "◈", "◌", "◆", "△", "○", "□", "◇", "▽", "✧", "☆", "⬡"];

function ProjectForm({
  project,
  onSave,
  onDelete,
  onCancel,
}: {
  project: Project | null;
  onSave: (data: Partial<Project>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(project?.name || "");
  const [emoji, setEmoji] = useState(project?.emoji || "✦");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Project Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name"
          data-testid="input-project-name"
        />
      </div>
      <div className="space-y-2">
        <Label>Emoji</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-lg border transition-colors",
                emoji === e ? "bg-primary/10 border-primary" : "hover:bg-muted"
              )}
              onClick={() => setEmoji(e)}
              data-testid={`button-emoji-${e}`}
            >
              <span className="text-lg">{e}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-4">
        {onDelete && (
          <Button
            variant="destructive"
            onClick={onDelete}
            data-testid="button-delete-project"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-project">
            Cancel
          </Button>
          <Button
            onClick={() => onSave({ name, emoji })}
            disabled={!name.trim()}
            data-testid="button-save-project"
          >
            {project ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background crt-lines noise">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0 bg-radial" />
      <div className="absolute inset-0 bg-radial-2" />
      <div className="relative mx-auto max-w-[1320px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function TeamPanel({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center justify-between gap-2 rounded-xl border bg-card/70 px-3 py-2 shadow-soft hover:bg-card/90 transition-colors"
        onClick={() => setOpen(!open)}
        data-testid="button-team-toggle"
      >
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
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-card/95 backdrop-blur-sm p-2 shadow-float animate-in fade-in-0 zoom-in-95"
            data-testid="panel-team-members"
          >
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Team Members
            </div>
            <div className="space-y-0.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-card/80 transition-colors cursor-pointer"
                  data-testid={`row-member-${m.id}`}
                >
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full border bg-gradient-to-br",
                      m.color,
                    )}
                  />
                  <div className="text-sm">{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Filters = {
  status: string[];
  priority: string[];
  projectId: string | null;
  assigneeId: string | null;
};

function TopBar({
  query,
  setQuery,
  onCreate,
  members,
  projects,
  filters,
  setFilters,
}: {
  query: string;
  setQuery: (v: string) => void;
  onCreate: () => void;
  members: Member[];
  projects: Project[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const hasActiveFilters = filters.status.length > 0 || filters.priority.length > 0 || filters.projectId || filters.assigneeId;
  const toggleStatus = (s: string) => {
    setFilters({
      ...filters,
      status: filters.status.includes(s) ? filters.status.filter((x) => x !== s) : [...filters.status, s],
    });
  };
  const togglePriority = (p: string) => {
    setFilters({
      ...filters,
      priority: filters.priority.includes(p) ? filters.priority.filter((x) => x !== p) : [...filters.priority, p],
    });
  };
  const clearFilters = () => setFilters({ status: [], priority: [], projectId: null, assigneeId: null });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl border bg-card/70 shadow-soft neon-ring"
              data-testid="badge-brand"
            >
              <Handshake
                className="h-4 w-4 text-[hsl(var(--primary))] text-neon"
                strokeWidth={2.4}
              />
            </div>
            <div className="min-w-0">
              <div
                className="font-display text-[22px] font-[720] tracking-[-0.02em]"
                data-testid="text-app-title"
              >
                Synergy
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WalletConnectButton onConnected={() => {}} />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? "default" : "secondary"}
                className="hidden sm:inline-flex"
                data-testid="button-filter"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Filters</div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs">
                      Clear All
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="flex flex-wrap gap-1">
                    {(["todo", "in_progress", "blocked", "done"] as const).map((s) => (
                      <Button
                        key={s}
                        variant={filters.status.includes(s) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleStatus(s)}
                        data-testid={`filter-status-${s}`}
                      >
                        {statusLabel[s]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <div className="flex flex-wrap gap-1">
                    {["High", "Medium", "Low"].map((p) => (
                      <Button
                        key={p}
                        variant={filters.priority.includes(p) ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => togglePriority(p)}
                        data-testid={`filter-priority-${p}`}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Project</Label>
                  <Select
                    value={filters.projectId ?? "__any__"}
                    onValueChange={(v) => setFilters({ ...filters, projectId: v === "__any__" ? null : v })}
                  >
                    <SelectTrigger className="h-8" data-testid="filter-project">
                      <SelectValue placeholder="Any project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">Any project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assignee</Label>
                  <Select
                    value={filters.assigneeId ?? "__any__"}
                    onValueChange={(v) => setFilters({ ...filters, assigneeId: v === "__any__" ? null : v })}
                  >
                    <SelectTrigger className="h-8" data-testid="filter-assignee">
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">Anyone</SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-4 w-4 rounded-full border bg-gradient-to-br", m.color)} />
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
            placeholder="Search tasks, meetings…"
            className="border-0 bg-transparent pl-1 pr-0 focus-visible:ring-0"
            data-testid="input-search"
          />
        </div>

        <TeamPanel members={members} />
      </div>
    </div>
  );
}

function LeftRail({
  active,
  setActive,
  projects,
  tasks,
  selectedProject,
  onSelectProject,
  onEditProject,
  onAddProject,
}: {
  active: "overview" | "calendar" | "tasks";
  setActive: (v: "overview" | "calendar" | "tasks") => void;
  projects: Project[];
  tasks: Task[];
  selectedProject: string | null;
  onSelectProject: (id: string | null) => void;
  onEditProject: (project: Project) => void;
  onAddProject: () => void;
}) {
  const taskCountByProject = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((t) => {
      if (t.projectId) {
        counts.set(t.projectId, (counts.get(t.projectId) || 0) + 1);
      }
    });
    return counts;
  }, [tasks]);

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

      <div className="flex items-center justify-between px-2">
        <div className="text-xs font-medium text-muted-foreground">Projects</div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6" 
          onClick={onAddProject}
          data-testid="button-add-project"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        {projects.map((p) => (
          <div
            key={p.id}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-colors hover:bg-[hsl(var(--foreground)/0.05)]",
              selectedProject === p.id && "bg-primary/10 ring-1 ring-primary/30"
            )}
            data-testid={`row-project-${p.id}`}
          >
            <button
              className="flex flex-1 items-center gap-2"
              onClick={() => onSelectProject(selectedProject === p.id ? null : p.id)}
            >
              <div
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border bg-card/70"
                data-testid={`badge-project-${p.id}`}
              >
                <span className="text-sm leading-none" aria-hidden>
                  {p.emoji}
                </span>
              </div>
              <div className="text-sm" data-testid={`text-project-${p.id}`}>
                {p.name}
              </div>
            </button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(p);
                }}
                data-testid={`button-edit-project-${p.id}`}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Badge variant="secondary" data-testid={`badge-count-${p.id}`}>
                {taskCountByProject.get(p.id) || 0}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "glass shadow-soft rounded-2xl p-4 text-left transition-all hover:-translate-y-[1px] hover:shadow-float cursor-pointer w-full",
        selected && "ring-2 ring-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
      )}
      onClick={onClick}
      data-testid={`button-metric-${label}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground" data-testid={`text-metric-${label}`}>
          {label}
        </div>
        <div className={cn(
          "h-2 w-2 rounded-full",
          selected ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--primary)/0.45)]"
        )} />
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
    </button>
  );
}

function TaskRow({
  t,
  membersMap,
  projects,
  onClick,
}: {
  t: Task;
  membersMap: Map<string, Member>;
  projects: Project[];
  onClick?: () => void;
}) {
  const p = projects.find((x) => x.id === t.projectId);
  return (
    <button
      className="group flex w-full items-center justify-between gap-4 rounded-xl border bg-card/70 px-3 py-3 shadow-soft text-left transition hover:-translate-y-[1px] hover:shadow-float cursor-pointer"
      onClick={onClick}
      data-testid={`row-task-${t.id}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-md border px-2 py-0.5 text-xs",
              statusClass(t.status as Status),
            )}
            data-testid={`badge-status-${t.id}`}
          >
            {statusLabel[t.status as Status]}
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
          className="mt-2 truncate text-sm font-medium pl-0.5"
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
    </button>
  );
}

type CalendarItem = { id: string; title: string; color: string; type: "event" | "task" };

function MonthGrid({
  month,
  selected,
  onSelect,
  events,
  tasks,
}: {
  month: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  events: Event[];
  tasks: Task[];
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
    const map = new Map<string, CalendarItem[]>();
    for (const e of events) {
      const k = format(e.start, "yyyy-MM-dd");
      map.set(k, [...(map.get(k) ?? []), { id: e.id, title: e.title, color: e.color, type: "event" }]);
    }
    for (const t of tasks) {
      if (t.due) {
        const k = format(new Date(t.due), "yyyy-MM-dd");
        map.set(k, [...(map.get(k) ?? []), { id: t.id, title: t.title, color: "task", type: "task" }]);
      }
    }
    return map;
  }, [events, tasks]);

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
          const dayItems = byDay.get(key) ?? [];
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
                {dayItems.length > 0 ? (
                  <div
                    className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))] opacity-80"
                    data-testid={`status-dayhasitems-${key}`}
                  />
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayItems.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "truncate rounded-md px-2 py-1 text-[11px]",
                      item.type === "task"
                        ? "bg-[hsl(355_45%_95%)] text-[hsl(var(--foreground))]"
                        : "bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]",
                    )}
                    data-testid={`pill-${item.type}-${item.id}`}
                  >
                    {item.title}
                  </div>
                ))}
                {dayItems.length > 2 ? (
                  <div className="text-[11px] text-muted-foreground" data-testid={`text-more-${key}`}>
                    +{dayItems.length - 2} more
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

function DayAgenda({ 
  selected, 
  tasks, 
  events,
  onTaskClick,
  onEventClick,
  onAddTask,
}: { 
  selected: Date; 
  tasks: Task[]; 
  events: Event[];
  onTaskClick?: (t: Task) => void;
  onEventClick?: (e: Event) => void;
  onAddTask?: () => void;
}) {
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
        <Button size="sm" variant="secondary" onClick={onAddTask} data-testid="button-add-agenda">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        {eventsForDay.length === 0 && tasksForDay.length === 0 ? (
          <div className="rounded-xl border bg-card/60 p-3 text-sm text-muted-foreground" data-testid="empty-agenda">
            Nothing scheduled. Pick a day with tasks or meetings.
          </div>
        ) : null}

        {eventsForDay.map((e) => (
          <button
            key={e.id}
            className="flex w-full items-center justify-between rounded-xl border bg-card/60 px-3 py-2 text-left cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => onEventClick?.(e)}
            data-testid={`row-event-${e.id}`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium" data-testid={`text-eventtitle-${e.id}`}>
                {e.title}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-eventmeta-${e.id}`}>
                {e.attendeeIds.length} attendee{e.attendeeIds.length === 1 ? "" : "s"}
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-[hsl(var(--primary)/0.14)] text-[hsl(var(--primary))]"
              data-testid={`badge-meeting-${e.id}`}
            >
              Meeting
            </Badge>
          </button>
        ))}

        {tasksForDay.map((t) => (
          <button
            key={t.id}
            className="flex w-full items-center justify-between rounded-xl border bg-card/60 px-3 py-2 text-left cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => onTaskClick?.(t)}
            data-testid={`row-agendatask-${t.id}`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium" data-testid={`text-agendatasktitle-${t.id}`}>
                {t.title}
              </div>
              <div className="text-xs text-muted-foreground" data-testid={`text-agendataskmeta-${t.id}`}>
                {statusLabel[t.status as Status]} • {t.priority}
              </div>
            </div>
            <div className={cn("rounded-md border px-2 py-0.5 text-xs", statusClass(t.status as Status))} data-testid={`badge-agendastatus-${t.id}`}>
              {statusLabel[t.status as Status]}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function WorkspacePage() {
  const queryClient = useQueryClient();
  const [active, setActive] = useState<"overview" | "calendar" | "tasks">(
    "overview",
  );
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [eventDateTouched, setEventDateTouched] = useState(false);
  const [eventTimeTouched, setEventTimeTouched] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [metricFilter, setMetricFilter] = useState<"week" | "progress" | "focus" | null>(null);
  const [filters, setFilters] = useState<{
    status: string[];
    priority: string[];
    projectId: string | null;
    assigneeId: string | null;
  }>({ status: [], priority: [], projectId: null, assigneeId: null });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: api.members.getAll,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.projects.getAll,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: api.tasks.getAll,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.events.getAll(),
  });

  const createTaskMutation = useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: api.events.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      api.tasks.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) =>
      api.events.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => api.events.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: api.projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsAddingProject(false);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      api.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => api.projects.delete(id),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingProject(null);
      if (selectedProject === deletedId) setSelectedProject(null);
    },
  });

  const membersMap = useMemo(() => {
    return new Map(members.map((m) => [m.id, m] as const));
  }, [members]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const thisWeekTasks = useMemo(() => 
    tasks.filter((t) => t.due && t.due >= weekStart && t.due <= weekEnd),
    [tasks, weekStart, weekEnd]
  );

  const inProgressTasks = useMemo(() => 
    tasks.filter((t) => t.status === "in_progress"),
    [tasks]
  );

  const activeProjects = useMemo(() => {
    const activeProjectIds = new Set(
      tasks.filter((t) => t.status === "in_progress").map((t) => t.projectId)
    );
    return projects.filter((p) => activeProjectIds.has(p.id));
  }, [tasks, projects]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (metricFilter === "week") {
      result = thisWeekTasks;
    } else if (metricFilter === "progress") {
      result = inProgressTasks;
    } else if (metricFilter === "focus") {
      const activeProjectIds = new Set(activeProjects.map((p) => p.id));
      result = result.filter((t) => t.projectId && activeProjectIds.has(t.projectId));
    }
    
    if (selectedProject) {
      result = result.filter((t) => t.projectId === selectedProject);
    }

    if (filters.status.length > 0) {
      result = result.filter((t) => filters.status.includes(t.status));
    }
    if (filters.priority.length > 0) {
      result = result.filter((t) => filters.priority.includes(t.priority));
    }
    if (filters.projectId) {
      result = result.filter((t) => t.projectId === filters.projectId);
    }
    if (filters.assigneeId) {
      result = result.filter((t) => t.assigneeIds.includes(filters.assigneeId!));
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((t) => {
        const p = projects.find((x) => x.id === t.projectId)?.name ?? "";
        return (
          t.title.toLowerCase().includes(q) ||
          statusLabel[t.status as Status]?.toLowerCase().includes(q) ||
          t.priority.toLowerCase().includes(q) ||
          p.toLowerCase().includes(q)
        );
      });
    }
    return result.sort((a, b) => {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    });
  }, [query, tasks, projects, selectedProject, metricFilter, thisWeekTasks, inProgressTasks, activeProjects, filters]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }, [events]);

  const sortedProjects = useMemo(() => {
    const projectLastActivity = new Map<string, Date>();
    tasks.forEach((t) => {
      if (t.projectId && t.due) {
        const current = projectLastActivity.get(t.projectId);
        const taskDate = new Date(t.due);
        if (!current || taskDate > current) {
          projectLastActivity.set(t.projectId, taskDate);
        }
      }
    });
    events.forEach((e) => {
      const eventDate = new Date(e.start);
      tasks.forEach((t) => {
        if (t.projectId) {
          const current = projectLastActivity.get(t.projectId);
          if (!current || eventDate > current) {
            projectLastActivity.set(t.projectId, eventDate);
          }
        }
      });
    });
    return [...projects].sort((a, b) => {
      const aDate = projectLastActivity.get(a.id);
      const bDate = projectLastActivity.get(b.id);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return bDate.getTime() - aDate.getTime();
    });
  }, [projects, tasks, events]);

  function onCreate() {
    setSelectedTask({
      id: "__new__",
      title: "",
      status: "",
      projectId: null,
      assigneeIds: [],
      due: null,
      priority: "",
    } as Task);
    setIsNewTask(true);
  }

  function addQuickEvent(fromCalendar: boolean = false) {
    setSelectedEvent({
      id: "__new__",
      title: "",
      start: fromCalendar ? selected : new Date(),
      end: null,
      color: "primary",
      attendeeIds: [],
    } as Event);
    setIsNewEvent(true);
    setEventDateTouched(fromCalendar);
    setEventTimeTouched(false);
  }

  function addQuickTask(fromCalendar: boolean = false) {
    setSelectedTask({
      id: "__new__",
      title: "",
      status: "",
      projectId: null,
      assigneeIds: [],
      due: fromCalendar ? selected : null,
      priority: "",
    } as Task);
    setIsNewTask(true);
  }

  return (
    <AppShell>
      <TopBar query={query} setQuery={setQuery} onCreate={onCreate} members={members} projects={projects} filters={filters} setFilters={setFilters} />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <LeftRail 
          active={active} 
          setActive={setActive} 
          projects={sortedProjects} 
          tasks={tasks}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onEditProject={setEditingProject}
          onAddProject={() => setIsAddingProject(true)}
        />

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
                  <MetricCard 
                    label="This Week" 
                    value={String(thisWeekTasks.length)} 
                    hint="items scheduled" 
                    selected={metricFilter === "week"}
                    onClick={() => setMetricFilter(metricFilter === "week" ? null : "week")}
                  />
                  <MetricCard 
                    label="In Progress" 
                    value={String(inProgressTasks.length)} 
                    hint="tasks moving" 
                    selected={metricFilter === "progress"}
                    onClick={() => setMetricFilter(metricFilter === "progress" ? null : "progress")}
                  />
                  <MetricCard 
                    label="Focus" 
                    value={String(activeProjects.length)} 
                    hint="projects active" 
                    selected={metricFilter === "focus"}
                    onClick={() => setMetricFilter(metricFilter === "focus" ? null : "focus")}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
                  <Card className="glass shadow-soft rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" data-testid="text-recents-title">Recent Tasks</div>
                        <div className="text-xs text-muted-foreground" data-testid="text-recents-subtitle">
                          A quick pulse across the team
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setActive("tasks")} data-testid="button-viewall">View All</Button>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      {filteredTasks.slice(0, 5).map((t) => (
                        <TaskRow key={t.id} t={t} membersMap={membersMap} projects={projects} onClick={() => { setSelectedTask(t); setIsNewTask(false); }} />
                      ))}
                    </div>
                  </Card>

                  <DayAgenda selected={selected} tasks={tasks} events={sortedEvents} onTaskClick={(t) => { setSelectedTask(t); setIsNewTask(false); }} onEventClick={(e) => { setSelectedEvent(e); setIsNewEvent(false); setEventDateTouched(false); setEventTimeTouched(false); }} onAddTask={() => addQuickTask(true)} />
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
                    <div className="text-xs text-muted-foreground" data-testid="text-calendar-subtitle">Click a day to see agenda.</div>
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
                      onClick={() => addQuickEvent(true)}
                      data-testid="button-add-event"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Meeting
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
                  <MonthGrid
                    month={month}
                    selected={selected}
                    onSelect={setSelected}
                    events={sortedEvents}
                    tasks={tasks}
                  />
                  <DayAgenda selected={selected} tasks={tasks} events={sortedEvents} onTaskClick={(t) => { setSelectedTask(t); setIsNewTask(false); }} onEventClick={(e) => { setSelectedEvent(e); setIsNewEvent(false); setEventDateTouched(false); setEventTimeTouched(false); }} onAddTask={() => addQuickTask(true)} />
                </div>
              </div>
            ) : null}

            {active === "tasks" ? (
              <div className="space-y-4">
                <div className="rounded-2xl border bg-card/70 p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-2xl font-[720] tracking-[-0.03em]" data-testid="text-tasks-title">
                      Tasks
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
                    <TaskRow key={t.id} t={t} membersMap={membersMap} projects={projects} onClick={() => { setSelectedTask(t); setIsNewTask(false); }} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) { setSelectedTask(null); setIsNewTask(false); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isNewTask ? "New Task" : "Edit Task"}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  data-testid="input-task-title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(v) => setSelectedTask({ ...selectedTask, status: v })}
                  >
                    <SelectTrigger data-testid="select-task-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(v) => setSelectedTask({ ...selectedTask, priority: v })}
                  >
                    <SelectTrigger data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={selectedTask.projectId ?? undefined}
                  onValueChange={(v) => setSelectedTask({ ...selectedTask, projectId: v })}
                >
                  <SelectTrigger data-testid="select-task-project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignees</Label>
                <div className="flex flex-wrap gap-2" data-testid="assignees-container">
                  {selectedTask.assigneeIds.map((id) => {
                    const m = members.find((mem) => mem.id === id);
                    if (!m) return null;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-2 py-1 text-sm text-[hsl(var(--primary))]"
                      >
                        <div className={cn("h-5 w-5 rounded-full border bg-gradient-to-br", m.color)} />
                        {m.name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTask({
                              ...selectedTask,
                              assigneeIds: selectedTask.assigneeIds.filter((i) => i !== m.id),
                            });
                          }}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-assignee-${m.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (!selectedTask.assigneeIds.includes(v)) {
                      setSelectedTask({ ...selectedTask, assigneeIds: [...selectedTask.assigneeIds, v] });
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-add-assignee">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members
                      .filter((m) => !selectedTask.assigneeIds.includes(m.id))
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-5 w-5 rounded-full border bg-gradient-to-br", m.color)} />
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedTask.due && "text-muted-foreground"
                      )}
                      data-testid="button-task-deadline"
                    >
                      <CalendarDays className="h-4 w-4" />
                      {selectedTask.due && (
                        <span className="ml-2">{format(new Date(selectedTask.due), "MMMM d, yyyy")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="top">
                    <Calendar
                      mode="single"
                      selected={selectedTask.due ? new Date(selectedTask.due) : undefined}
                      onSelect={(date) => {
                        if (date && selectedTask.due) {
                          const existing = new Date(selectedTask.due);
                          date.setHours(existing.getHours(), existing.getMinutes());
                        }
                        setSelectedTask({ ...selectedTask, due: date || null });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={selectedTask.due ? format(new Date(selectedTask.due), "HH:mm") : ""}
                  onChange={(e) => {
                    if (e.target.value && selectedTask.due) {
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      const newDate = new Date(selectedTask.due);
                      newDate.setHours(hours, minutes);
                      setSelectedTask({ ...selectedTask, due: newDate });
                    } else if (e.target.value && !selectedTask.due) {
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      const newDate = new Date();
                      newDate.setHours(hours, minutes, 0, 0);
                      setSelectedTask({ ...selectedTask, due: newDate });
                    }
                  }}
                  data-testid="input-task-time"
                />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                {!isNewTask && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deleteTaskMutation.mutate(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    data-testid="button-delete-task"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="secondary" onClick={() => { setSelectedTask(null); setIsNewTask(false); }} data-testid="button-cancel-task">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (isNewTask) {
                        createTaskMutation.mutate({
                          title: selectedTask.title,
                          status: selectedTask.status,
                          priority: selectedTask.priority,
                          projectId: selectedTask.projectId,
                          assigneeIds: selectedTask.assigneeIds,
                          due: selectedTask.due,
                        });
                      } else {
                        updateTaskMutation.mutate({
                          id: selectedTask.id,
                          data: {
                            title: selectedTask.title,
                            status: selectedTask.status,
                            priority: selectedTask.priority,
                            projectId: selectedTask.projectId,
                            assigneeIds: selectedTask.assigneeIds,
                            due: selectedTask.due,
                          },
                        });
                      }
                      setSelectedTask(null);
                      setIsNewTask(false);
                    }}
                    data-testid="button-save-task"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setIsNewEvent(false); setEventDateTouched(false); setEventTimeTouched(false); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isNewEvent ? "New Meeting" : "Edit Meeting"}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={selectedEvent.title}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  data-testid="input-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <div className="flex flex-wrap gap-2" data-testid="attendees-container">
                  {selectedEvent.attendeeIds.map((id) => {
                    const m = members.find((mem) => mem.id === id);
                    if (!m) return null;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] px-2 py-1 text-sm text-[hsl(var(--primary))]"
                      >
                        <div className={cn("h-5 w-5 rounded-full border bg-gradient-to-br", m.color)} />
                        {m.name}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEvent({
                              ...selectedEvent,
                              attendeeIds: selectedEvent.attendeeIds.filter((i) => i !== m.id),
                            });
                          }}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-attendee-${m.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <Select
                  value="__add__"
                  onValueChange={(v) => {
                    if (v !== "__add__" && !selectedEvent.attendeeIds.includes(v)) {
                      setSelectedEvent({ ...selectedEvent, attendeeIds: [...selectedEvent.attendeeIds, v] });
                    }
                  }}
                >
                  <SelectTrigger data-testid="select-add-attendee">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                                        {members
                      .filter((m) => !selectedEvent.attendeeIds.includes(m.id))
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-5 w-5 rounded-full border bg-gradient-to-br", m.color)} />
                            {m.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="button-event-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {(!isNewEvent || eventDateTouched) && selectedEvent.start ? format(new Date(selectedEvent.start), "MMMM d, yyyy") : ""}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={(!isNewEvent || eventDateTouched) ? new Date(selectedEvent.start) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const existing = new Date(selectedEvent.start);
                          date.setHours(existing.getHours(), existing.getMinutes());
                          setSelectedEvent({ ...selectedEvent, start: date });
                          setEventDateTouched(true);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={(!isNewEvent || eventTimeTouched) ? format(new Date(selectedEvent.start), "HH:mm") : ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      const newDate = new Date(selectedEvent.start);
                      newDate.setHours(hours, minutes);
                      setSelectedEvent({ ...selectedEvent, start: newDate });
                      setEventTimeTouched(true);
                    }
                  }}
                  data-testid="input-event-time"
                />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                {!isNewEvent && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deleteEventMutation.mutate(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    data-testid="button-delete-event"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="secondary" onClick={() => { setSelectedEvent(null); setIsNewEvent(false); setEventDateTouched(false); setEventTimeTouched(false); }} data-testid="button-cancel-event">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (isNewEvent) {
                        createEventMutation.mutate({
                          title: selectedEvent.title,
                          start: selectedEvent.start,
                          end: selectedEvent.end,
                          color: selectedEvent.color,
                          attendeeIds: selectedEvent.attendeeIds,
                        });
                      } else {
                        updateEventMutation.mutate({
                          id: selectedEvent.id,
                          data: {
                            title: selectedEvent.title,
                            start: selectedEvent.start,
                            attendeeIds: selectedEvent.attendeeIds,
                          },
                        });
                      }
                      setSelectedEvent(null);
                      setIsNewEvent(false);
                      setEventDateTouched(false);
                      setEventTimeTouched(false);
                    }}
                    data-testid="button-save-event"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isAddingProject || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setIsAddingProject(false);
          setEditingProject(null);
        }
      }}>
        <DialogContent className="sm:max-w-md glass">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={editingProject}
            onSave={(data) => {
              if (editingProject) {
                updateProjectMutation.mutate({ id: editingProject.id, data });
              } else {
                createProjectMutation.mutate(data as any);
              }
            }}
            onDelete={editingProject ? () => deleteProjectMutation.mutate(editingProject.id) : undefined}
            onCancel={() => {
              setIsAddingProject(false);
              setEditingProject(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
