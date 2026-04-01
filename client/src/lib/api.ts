import type { Member, Project, Task, Event, SynergyData } from "./types";

const REPO = "justalexty/Synergy";
const DATA_PATH = "data/synergy.json";
const API_BASE = "https://api.github.com";

// Cache for current data and SHA
let cachedData: SynergyData | null = null;
let cachedSha: string | null = null;

function getToken(): string | null {
  return sessionStorage.getItem("synergy_github_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Deserialize raw JSON data (strings → proper Date objects)
function deserializeData(raw: any): SynergyData {
  return {
    members: (raw.members || []) as Member[],
    projects: (raw.projects || []) as Project[],
    tasks: (raw.tasks || []).map((t: any) => ({
      ...t,
      due: t.due ? new Date(t.due) : null,
    })) as Task[],
    events: (raw.events || []).map((e: any) => ({
      ...e,
      start: new Date(e.start),
      end: e.end ? new Date(e.end) : null,
    })) as Event[],
  };
}

// Serialize data (Date → ISO strings)
function serializeData(data: SynergyData): any {
  return {
    members: data.members,
    projects: data.projects,
    tasks: data.tasks.map((t) => ({
      ...t,
      due: t.due ? t.due.toISOString() : null,
    })),
    events: data.events.map((e) => ({
      ...e,
      start: e.start instanceof Date ? e.start.toISOString() : e.start,
      end: e.end ? (e.end instanceof Date ? e.end.toISOString() : e.end) : null,
    })),
  };
}

async function loadData(): Promise<SynergyData> {
  if (cachedData) return cachedData;

  const res = await fetch(`${API_BASE}/repos/${REPO}/contents/${DATA_PATH}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Failed to load data: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  cachedSha = json.sha;

  // GitHub returns base64-encoded content
  const decoded = atob(json.content.replace(/\n/g, ""));
  const raw = JSON.parse(decoded);
  cachedData = deserializeData(raw);
  return cachedData;
}

async function saveData(data: SynergyData): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error("No GitHub token configured. Please set your token in Settings.");
  }

  if (!cachedSha) {
    // Need to fetch SHA first
    await loadData();
  }

  const serialized = serializeData(data);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(serialized, null, 2))));

  const res = await fetch(`${API_BASE}/repos/${REPO}/contents/${DATA_PATH}`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update synergy data",
      content,
      sha: cachedSha,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to save data: ${res.status} ${errBody.message || res.statusText}`);
  }

  const result = await res.json();
  cachedSha = result.content.sha;
  cachedData = data;
}

function invalidateCache() {
  cachedData = null;
  // Keep SHA so we can still write; it will be refreshed on next load
}

export const api = {
  members: {
    getAll: async (): Promise<Member[]> => {
      const data = await loadData();
      return data.members;
    },
    get: async (id: string): Promise<Member> => {
      const data = await loadData();
      const m = data.members.find((x) => x.id === id);
      if (!m) throw new Error(`Member ${id} not found`);
      return m;
    },
    create: async (input: Omit<Member, "id">): Promise<Member> => {
      const data = await loadData();
      const newMember: Member = { ...input, id: crypto.randomUUID() };
      const updated: SynergyData = { ...data, members: [...data.members, newMember] };
      await saveData(updated);
      return newMember;
    },
    update: async (id: string, input: Partial<Omit<Member, "id">>): Promise<Member> => {
      const data = await loadData();
      const idx = data.members.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`Member ${id} not found`);
      const updated_member = { ...data.members[idx], ...input };
      const members = [...data.members];
      members[idx] = updated_member;
      await saveData({ ...data, members });
      return updated_member;
    },
  },

  projects: {
    getAll: async (): Promise<Project[]> => {
      const data = await loadData();
      return data.projects;
    },
    get: async (id: string): Promise<Project> => {
      const data = await loadData();
      const p = data.projects.find((x) => x.id === id);
      if (!p) throw new Error(`Project ${id} not found`);
      return p;
    },
    create: async (input: Omit<Project, "id">): Promise<Project> => {
      const data = await loadData();
      const newProject: Project = { ...input, id: crypto.randomUUID() };
      const updated: SynergyData = { ...data, projects: [...data.projects, newProject] };
      await saveData(updated);
      return newProject;
    },
    update: async (id: string, input: Partial<Omit<Project, "id">>): Promise<Project> => {
      const data = await loadData();
      const idx = data.projects.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`Project ${id} not found`);
      const updated_project = { ...data.projects[idx], ...input };
      const projects = [...data.projects];
      projects[idx] = updated_project;
      await saveData({ ...data, projects });
      return updated_project;
    },
    delete: async (id: string): Promise<void> => {
      const data = await loadData();
      const projects = data.projects.filter((x) => x.id !== id);
      // Null out projectId on tasks that referenced this project
      const tasks = data.tasks.map((t) => t.projectId === id ? { ...t, projectId: null } : t);
      await saveData({ ...data, projects, tasks });
    },
  },

  tasks: {
    getAll: async (): Promise<Task[]> => {
      const data = await loadData();
      return data.tasks;
    },
    get: async (id: string): Promise<Task> => {
      const data = await loadData();
      const t = data.tasks.find((x) => x.id === id);
      if (!t) throw new Error(`Task ${id} not found`);
      return t;
    },
    create: async (input: Omit<Task, "id">): Promise<Task> => {
      const data = await loadData();
      const newTask: Task = { ...input, id: crypto.randomUUID() };
      const updated: SynergyData = { ...data, tasks: [...data.tasks, newTask] };
      await saveData(updated);
      return newTask;
    },
    update: async (id: string, input: Partial<Omit<Task, "id">>): Promise<Task> => {
      const data = await loadData();
      const idx = data.tasks.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`Task ${id} not found`);
      const updated_task = { ...data.tasks[idx], ...input };
      const tasks = [...data.tasks];
      tasks[idx] = updated_task;
      await saveData({ ...data, tasks });
      return updated_task;
    },
    delete: async (id: string): Promise<void> => {
      const data = await loadData();
      const tasks = data.tasks.filter((x) => x.id !== id);
      await saveData({ ...data, tasks });
    },
  },

  events: {
    getAll: async (_start?: Date, _end?: Date): Promise<Event[]> => {
      const data = await loadData();
      return data.events;
    },
    get: async (id: string): Promise<Event> => {
      const data = await loadData();
      const e = data.events.find((x) => x.id === id);
      if (!e) throw new Error(`Event ${id} not found`);
      return e;
    },
    create: async (input: Omit<Event, "id">): Promise<Event> => {
      const data = await loadData();
      const newEvent: Event = { ...input, id: crypto.randomUUID() };
      const updated: SynergyData = { ...data, events: [...data.events, newEvent] };
      await saveData(updated);
      return newEvent;
    },
    update: async (id: string, input: Partial<Omit<Event, "id">>): Promise<Event> => {
      const data = await loadData();
      const idx = data.events.findIndex((x) => x.id === id);
      if (idx === -1) throw new Error(`Event ${id} not found`);
      const updated_event = { ...data.events[idx], ...input };
      const events = [...data.events];
      events[idx] = updated_event;
      await saveData({ ...data, events });
      return updated_event;
    },
    delete: async (id: string): Promise<void> => {
      const data = await loadData();
      const events = data.events.filter((x) => x.id !== id);
      await saveData({ ...data, events });
    },
  },

  // Token management
  hasToken: (): boolean => !!getToken(),
  setToken: (token: string) => {
    sessionStorage.setItem("synergy_github_token", token);
    invalidateCache();
  },
  clearToken: () => {
    sessionStorage.removeItem("synergy_github_token");
    invalidateCache();
  },
};
