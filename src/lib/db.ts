import Dexie, { Table } from 'dexie';
import { Ticket, ArchiveEntry, Project, Tag, DayEntry, Event, LocationHistory } from '../types';

export class KanbanDB extends Dexie {
  tickets!: Table<Ticket>;
  archive!: Table<ArchiveEntry>;
  projects!: Table<Project>;
  tags!: Table<Tag>;
  dayEntries!: Table<DayEntry>;
  events!: Table<Event>;
  locations!: Table<LocationHistory>;

  constructor() {
    super('kanban');
    this.version(1).stores({
      tickets: '++id, date, status, projectId',
      archive: '++id, completedDate',
      projects: '++id, group, endDate',
    });

    // v2: add tags table (and allow new fields on existing tables)
    this.version(2).stores({
      tickets: '++id, date, status, projectId',
      archive: '++id, completedDate',
      projects: '++id, group, endDate',
      tags: 'id',
    });

    // v3: add dayEntries table for calendar feature
    this.version(3).stores({
      tickets: '++id, date, status, projectId',
      archive: '++id, completedDate',
      projects: '++id, group, endDate',
      tags: 'id',
      dayEntries: 'date',
    });

    // v4: add events and location history
    this.version(4).stores({
      tickets: '++id, date, status, projectId',
      archive: '++id, completedDate',
      projects: '++id, group, endDate',
      tags: 'id',
      dayEntries: 'date',
      events: '++id, date, projectId',
      locations: 'location',
    });
  }
}

export const db = new KanbanDB();

export async function getTicketsForDate(date: string): Promise<Ticket[]> {
  return db.tickets.where('date').equals(date).toArray();
}

export async function getTicketsForProject(projectId: string): Promise<Ticket[]> {
  return db.tickets.where('projectId').equals(projectId).toArray();
}

export async function getTicketsForProjectOnDate(
  projectId: string,
  date: string
): Promise<Ticket[]> {
  return db.tickets
    .where('projectId')
    .equals(projectId)
    .and((t) => t.date === date)
    .toArray();
}

export async function getTicketById(id: string): Promise<Ticket | undefined> {
  return db.tickets.get(id);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function updateTicket(ticket: Ticket): Promise<string> {
  return db.tickets.put(ticket);
}

export async function addTicket(ticket: Ticket): Promise<string> {
  return db.tickets.add(ticket);
}

export async function deleteTicket(id: string): Promise<void> {
  // Dexie primary key type can vary depending on earlier schema versions.
  // Try direct delete first, then fall back to a predicate delete.
  try {
    await db.tickets.delete(id as any);
  } catch {
    // ignore and fall back
  }
  await db.tickets
    .filter((t: any) => String(t?.id) === String(id))
    .delete();
}

export async function searchTickets(query: string): Promise<Ticket[]> {
  const all = await db.tickets.toArray();
  const lower = query.toLowerCase();
  return all.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

export async function getArchive(): Promise<ArchiveEntry[]> {
  return db.archive.toArray();
}

export async function archiveTickets(
  date: string,
  completedTickets: Ticket[],
  incompleteTickets: Ticket[]
): Promise<void> {
  // Archive completed tickets
  if (completedTickets.length > 0) {
    await db.archive.add({
      id: `archive-${date}-${Date.now()}`,
      completedDate: date,
      tickets: completedTickets,
    });
  }

  // Move incomplete to next day
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  for (const ticket of incompleteTickets) {
    ticket.date = nextDateStr;
    await updateTicket(ticket);
  }
}

// Projects
export async function addProject(project: Project): Promise<string> {
  return db.projects.add(project);
}

export async function getProjects(): Promise<Project[]> {
  return db.projects.toArray();
}

export async function updateProject(project: Project): Promise<string> {
  return db.projects.put(project);
}

export async function deleteProject(id: string): Promise<void> {
  return db.projects.delete(id);
}

export async function deleteTicketsForProject(projectId: string): Promise<void> {
  await db.tickets.where('projectId').equals(projectId).delete();
}

export async function getProjectsByGroup(group: string): Promise<Project[]> {
  return db.projects.where('group').equals(group).toArray();
}

// Tags
export async function getTags(): Promise<Tag[]> {
  return db.tags.toArray();
}

export async function upsertTag(tag: Tag): Promise<string> {
  return db.tags.put(tag);
}

export async function deleteTag(id: string): Promise<void> {
  return db.tags.delete(id);
}

export async function ensureTagsExist(tagIds: string[]): Promise<void> {
  const normalized = Array.from(
    new Set(tagIds.map((t) => t.trim()).filter(Boolean))
  );
  if (normalized.length === 0) return;

  const existing = await db.tags.bulkGet(normalized);
  const now = Date.now();
  const missing: Tag[] = [];
  normalized.forEach((id, idx) => {
    if (!existing[idx]) {
      missing.push({ id, createdAt: now });
    }
  });
  if (missing.length > 0) {
    await db.tags.bulkPut(missing);
  }
}

// Day Entries (Calendar)
export async function getDayEntry(date: string): Promise<DayEntry | undefined> {
  return db.dayEntries.get(date);
}

export async function upsertDayEntry(dayEntry: DayEntry): Promise<string> {
  return db.dayEntries.put(dayEntry);
}

export async function getDayEntriesForMonth(year: number, month: number): Promise<DayEntry[]> {
  // Get all day entries for the specified month
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  
  return db.dayEntries
    .where('date')
    .between(startDate, endDateStr, true, true)
    .toArray();
}

export async function getDeferredTicketsForDate(date: string): Promise<Ticket[]> {
  // Get tickets that were deferred to this date (status is 'todo' and date matches)
  return db.tickets
    .where('date')
    .equals(date)
    .and((t) => t.status === 'todo')
    .toArray();
}

// Import/Export
export type ExportPayload = {
  version: 1;
  exportedAt: number;
  tickets: Ticket[];
  projects: Project[];
  archive: ArchiveEntry[];
  tags: Tag[];
  dayEntries: DayEntry[];
  events: Event[];
  locations: LocationHistory[];
};

export async function exportAll(): Promise<ExportPayload> {
  const [tickets, projects, archive, tags, dayEntries, events, locations] = await Promise.all([
    db.tickets.toArray(),
    db.projects.toArray(),
    db.archive.toArray(),
    db.tags.toArray(),
    db.dayEntries.toArray(),
    db.events.toArray(),
    db.locations.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    tickets,
    projects,
    archive,
    tags,
    dayEntries,
    events,
    locations,
  };
}

export async function importAll(payload: Partial<ExportPayload>): Promise<void> {
  const tickets = Array.isArray(payload.tickets) ? payload.tickets : [];
  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const archive = Array.isArray(payload.archive) ? payload.archive : [];
  const tags = Array.isArray(payload.tags) ? payload.tags : [];
  const dayEntries = Array.isArray(payload.dayEntries) ? payload.dayEntries : [];
  const events = Array.isArray(payload.events) ? payload.events : [];
  const locations = Array.isArray(payload.locations) ? payload.locations : [];

  await db.transaction('rw', [db.tickets, db.projects, db.archive, db.tags, db.dayEntries, db.events, db.locations], async () => {
    if (projects.length > 0) await db.projects.bulkPut(projects);
    if (tickets.length > 0) await db.tickets.bulkPut(tickets);
    if (archive.length > 0) await db.archive.bulkPut(archive);
    if (tags.length > 0) await db.tags.bulkPut(tags);
    if (dayEntries.length > 0) await db.dayEntries.bulkPut(dayEntries);
    if (events.length > 0) await db.events.bulkPut(events);
    if (locations.length > 0) await db.locations.bulkPut(locations);
  });
}
