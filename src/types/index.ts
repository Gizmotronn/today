export interface Project {
  id: string;
  name: string;
  group: string; // grouping category
  status?: 'inProgress' | 'pending' | 'completed';
  icon?: {
    type: 'emoji' | 'image';
    value: string; // emoji char(s) or data URL
  };
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  description?: string;
  color?: string; // hex color code for events/tasks
  createdAt: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM format
  projectId: string; // reference to project ID
  createdAt: number;
}

export interface Tag {
  id: string; // tag text
  icon?: {
    type: 'emoji' | 'image';
    value: string; // emoji char(s) or data URL
  };
  createdAt: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  tags: string[];
  projectId: string; // reference to project ID
  status: 'todo' | 'inProgress' | 'done';
  date: string; // YYYY-MM-DD
  blockers: string[]; // ticket IDs that block this
  required: string[]; // ticket IDs that this requires
  createdAt: number;
  completedAt?: number;
  deferred?: boolean; // task is deferred (shows on calendar)
  priority?: boolean; // high priority - blocks other tasks, can't be moved back from inProgress
}

export interface ArchiveEntry {
  id: string;
  completedDate: string; // YYYY-MM-DD
  tickets: Ticket[];
}

export type DayMood = '🫤' | '🙂' | '🎈';

export interface DayEntry {
  date: string; // YYYY-MM-DD
  mood?: DayMood;
  completed: boolean; // whether the day is marked as finished
}

export interface LocationHistory {
  location: string;
  lastUsed: number; // timestamp
}
