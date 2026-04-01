export interface Member {
  id: string;
  walletAddress?: string | null;
  name: string;
  handle: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  projectId: string | null;
  assigneeIds: string[];
  due: Date | null;
  priority: string;
}

export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
  color: string;
  attendeeIds: string[];
}

export interface SynergyData {
  members: Member[];
  projects: Project[];
  tasks: Task[];
  events: Event[];
}
