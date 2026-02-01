import type { Member, Project, Task, Event } from "@shared/schema";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  members: {
    getAll: () => fetchJson<Member[]>("/members"),
    get: (id: string) => fetchJson<Member>(`/members/${id}`),
    create: (data: Omit<Member, "id">) =>
      fetchJson<Member>("/members", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Member, "id">>) =>
      fetchJson<Member>(`/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  projects: {
    getAll: () => fetchJson<Project[]>("/projects"),
    get: (id: string) => fetchJson<Project>(`/projects/${id}`),
    create: (data: Omit<Project, "id">) =>
      fetchJson<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Project, "id">>) =>
      fetchJson<Project>(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  tasks: {
    getAll: () => fetchJson<Task[]>("/tasks"),
    get: (id: string) => fetchJson<Task>(`/tasks/${id}`),
    create: (data: Omit<Task, "id">) =>
      fetchJson<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Task, "id">>) =>
      fetchJson<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/tasks/${id}`, {
        method: "DELETE",
      }),
  },

  events: {
    getAll: (start?: Date, end?: Date) => {
      const params = new URLSearchParams();
      if (start) params.set("start", start.toISOString());
      if (end) params.set("end", end.toISOString());
      const query = params.toString();
      return fetchJson<Event[]>(`/events${query ? `?${query}` : ""}`);
    },
    get: (id: string) => fetchJson<Event>(`/events/${id}`),
    create: (data: Omit<Event, "id">) =>
      fetchJson<Event>("/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Omit<Event, "id">>) =>
      fetchJson<Event>(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<void>(`/events/${id}`, {
        method: "DELETE",
      }),
  },
};
