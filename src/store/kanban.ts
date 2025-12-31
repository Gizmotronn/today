import { create } from 'zustand';
import { Ticket, Project, Tag, DayEntry, DayMood, Event, LocationHistory } from '../types';
import {
  getTicketsForDate,
  getTicketsForProjectOnDate,
  updateTicket,
  addTicket as addTicketDb,
  deleteTicket,
  deleteTicketsForProject,
  archiveTickets as archiveTicketsDb,
  searchTickets,
  getProjects,
  addProject as addProjectDb,
  updateProject as updateProjectDb,
  deleteProject as deleteProjectDb,
  getTags,
  upsertTag as upsertTagDb,
  deleteTag as deleteTagDb,
  ensureTagsExist,
  upsertDayEntry,
  getDayEntriesForMonth,
} from '../lib/db';
import {
  addEvent as addEventDb,
  getEventsForDate,
  updateEvent as updateEventDb,
  deleteEvent as deleteEventDb,
  getLocationHistory,
  recordLocation as recordLocationDb,
} from '../lib/events';

interface KanbanStore {
  tickets: Ticket[];
  projects: Project[];
  tags: Tag[];
  events: Event[];
  locationHistory: LocationHistory[];
  selectedDate: string;
  selectedProjectId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
  deferredTicket: Ticket | null;
  view:
    | 'board'
    | 'archive'
    | 'search'
    | 'projects'
    | 'tags'
    | 'analytics'
    | 'importExport'
    | 'projectTickets'
    | 'calendar';
  
  // Calendar state
  calendarMonth: number; // 0-11
  calendarYear: number;
  dayEntries: Map<string, DayEntry>; // date -> DayEntry
  selectedCalendarDate: string | null; // selected day in calendar

  // Actions
  loadTickets: (date: string) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadTags: () => Promise<void>;
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => Promise<void>;
  updateTicket: (ticket: Ticket) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  moveTicket: (ticketId: string, status: Ticket['status']) => Promise<void>;
  deferTicket: (ticket: Ticket) => void;
  clearDeferred: () => void;
  moveToDate: (ticketId: string, date: string) => Promise<void>;
  archiveDay: () => Promise<void>;
  search: (query: string) => Promise<void>;
  setView: (view: KanbanStore['view']) => void;
  setSelectedDate: (date: string) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setSelectedTagId: (tagId: string | null) => void;
  canMoveTicket: (ticketId: string) => boolean;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Tag actions
  upsertTag: (tag: Omit<Tag, 'createdAt'> & { createdAt?: number }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;

  // Calendar actions
  setCalendarMonth: (month: number, year: number) => Promise<void>;
  loadDayEntriesForMonth: (month: number, year: number) => Promise<void>;
  updateDayMood: (date: string, mood: DayMood | undefined) => Promise<void>;
  toggleDayCompleted: (date: string) => Promise<void>;
  setSelectedCalendarDate: (date: string | null) => void;

  // Event actions
  loadEvents: (date: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'createdAt'>) => Promise<void>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loadLocationHistory: () => Promise<void>;
  recordLocation: (location: string) => Promise<void>;
}

export const useKanban = create<KanbanStore>((set, get) => ({
  tickets: [],
  projects: [],
  tags: [],
  events: [],
  locationHistory: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedProjectId: null,
  selectedTagId: null,
  searchQuery: '',
  deferredTicket: null,
  view: 'board',
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  dayEntries: new Map(),
  selectedCalendarDate: null,

  loadTickets: async (date: string) => {
    const { selectedProjectId, selectedTagId } = get();
    const base = selectedProjectId
      ? await getTicketsForProjectOnDate(selectedProjectId, date)
      : await getTicketsForDate(date);
    const filtered = selectedTagId
      ? base.filter((t) => (t.tags || []).includes(selectedTagId))
      : base;
    set({ tickets: filtered, selectedDate: date });
  },

  loadProjects: async () => {
    const projects = await getProjects();
    set({ projects });
  },

  loadTags: async () => {
    const tags = await getTags();
    set({ tags });
  },

  addTicket: async (ticketData) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ticket: Ticket = {
      ...ticketData,
      id,
      createdAt: Date.now(),
    };
    await ensureTagsExist(ticket.tags || []);
    await addTicketDb(ticket);
    const { selectedDate } = get();
    await get().loadTickets(selectedDate);
    await get().loadTags();
  },

  updateTicket: async (ticket) => {
    await ensureTagsExist(ticket.tags || []);
    await updateTicket(ticket);
    const { selectedDate } = get();
    await get().loadTickets(selectedDate);
    await get().loadTags();
  },

  deleteTicket: async (id) => {
    await deleteTicket(id);
    const { selectedDate } = get();
    await get().loadTickets(selectedDate);
  },

  moveTicket: async (ticketId, status) => {
    const { tickets, selectedDate, canMoveTicket } = get();
    if (!canMoveTicket(ticketId)) {
      alert('Cannot move: this ticket is blocked by incomplete tickets');
      return;
    }

    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      // Priority tickets cannot be moved back from inProgress
      if (ticket.priority && ticket.status === 'inProgress' && status !== 'inProgress' && status !== 'done') {
        alert('Cannot move: this is a priority ticket and must be completed');
        return;
      }

      // If moving a non-priority ticket to inProgress, check if there's a priority ticket already there
      if (status === 'inProgress' && !ticket.priority) {
        const priorityInProgress = tickets.some((t) => 
          t.id !== ticketId && t.priority && t.status === 'inProgress'
        );
        if (priorityInProgress) {
          alert('Cannot move: a priority ticket is already in progress');
          return;
        }
      }

      ticket.status = status;
      if (status === 'done') {
        ticket.completedAt = Date.now();
      }
      await updateTicket(ticket);
      get().loadTickets(selectedDate);
    }
  },

  deferTicket: (ticket) => {
    set({ deferredTicket: ticket });
  },

  clearDeferred: () => {
    set({ deferredTicket: null });
  },

  moveToDate: async (ticketId, newDate) => {
    const { tickets, selectedDate } = get();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.date = newDate;
      ticket.status = 'todo';
      await updateTicket(ticket);
      get().clearDeferred();
      // Keep the user on the current board date; moving to another day shouldn't
      // unexpectedly navigate away and make the board look "empty".
      await get().loadTickets(selectedDate);
    }
  },

  archiveDay: async () => {
    const { tickets, selectedDate } = get();
    const completed = tickets.filter((t) => t.status === 'done');
    const incomplete = tickets.filter((t) => t.status !== 'done');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Archive completed tickets (store them in archive table)
    if (completed.length > 0) {
      await archiveTicketsDb(selectedDate, completed, []);
    }
    
    // Move incomplete tickets to today and reset status to todo
    for (const ticket of incomplete) {
      ticket.date = today;
      ticket.status = 'todo';
      await updateTicket(ticket);
    }
    
    // Switch view to today and reload
    set({ selectedDate: today });
    await get().loadTickets(today);
  },

  search: async (query) => {
    if (!query.trim()) {
      set({ searchQuery: '', view: 'board' });
      return;
    }
    const results = await searchTickets(query);
    set({ tickets: results, searchQuery: query, view: 'search' });
  },

  setView: (view) => {
    set({ view });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setSelectedProjectId: (projectId) => {
    set({ selectedProjectId: projectId });
  },

  setSelectedTagId: (tagId) => {
    set({ selectedTagId: tagId });
  },

  canMoveTicket: (ticketId) => {
    const { tickets } = get();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status === 'done') return true;

    // Check if any blockers are incomplete
    const blockerIds = ticket.blockers || [];
    return !blockerIds.some((blockerId) => {
      const blocker = tickets.find((t) => t.id === blockerId);
      return blocker && blocker.status !== 'done';
    });
  },

  addProject: async (projectData) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const project: Project = {
      ...projectData,
      id,
      createdAt: Date.now(),
    };
    await addProjectDb(project);
    get().loadProjects();
  },

  updateProject: async (project) => {
    await updateProjectDb(project);
    get().loadProjects();
  },

  deleteProject: async (id) => {
    const { selectedProjectId, selectedDate } = get();
    await deleteTicketsForProject(id);
    await deleteProjectDb(id);
    if (selectedProjectId === id) {
      set({ selectedProjectId: null, selectedTagId: null });
      await get().loadTickets(selectedDate);
    }
    get().loadProjects();
  },

  upsertTag: async (tag) => {
    const createdAt = tag.createdAt ?? Date.now();
    await upsertTagDb({ ...tag, createdAt } as Tag);
    await get().loadTags();
  },

  deleteTag: async (id) => {
    await deleteTagDb(id);
    await get().loadTags();
  },

  setCalendarMonth: async (month, year) => {
    set({ calendarMonth: month, calendarYear: year });
    await get().loadDayEntriesForMonth(month, year);
  },

  loadDayEntriesForMonth: async (month, year) => {
    const entries = await getDayEntriesForMonth(year, month);
    const map = new Map<string, DayEntry>();
    const today = new Date().toISOString().split('T')[0];
    
    entries.forEach((entry) => {
      map.set(entry.date, entry);
    });
    
    // Auto-complete past days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr < today && !map.has(dateStr)) {
        const autoEntry: DayEntry = {
          date: dateStr,
          completed: true,
        };
        map.set(dateStr, autoEntry);
        // Save to database
        await upsertDayEntry(autoEntry);
      }
    }
    
    set({ dayEntries: map });
  },

  updateDayMood: async (date, mood) => {
    const { dayEntries } = get();
    const existing = dayEntries.get(date);
    const updated: DayEntry = {
      date,
      mood,
      completed: existing?.completed ?? false,
    };
    await upsertDayEntry(updated);
    const newMap = new Map(dayEntries);
    newMap.set(date, updated);
    set({ dayEntries: newMap });
  },

  toggleDayCompleted: async (date) => {
    const { dayEntries } = get();
    const existing = dayEntries.get(date);
    const updated: DayEntry = {
      date,
      mood: existing?.mood,
      completed: !(existing?.completed ?? false),
    };
    await upsertDayEntry(updated);
    const newMap = new Map(dayEntries);
    newMap.set(date, updated);
    set({ dayEntries: newMap });
  },

  setSelectedCalendarDate: (date) => {
    set({ selectedCalendarDate: date });
  },

  // Event actions
  loadEvents: async (date) => {
    const newEvents = await getEventsForDate(date);
    const { events } = get();
    // Merge events: remove old events for this date and add new ones
    const filteredEvents = events.filter(e => e.date !== date);
    set({ events: [...filteredEvents, ...newEvents] });
  },

  addEvent: async (event) => {
    const id = `event-${Date.now()}`;
    await addEventDb({
      ...event,
      id,
      createdAt: Date.now(),
    });
    // Reload events for this date to ensure it shows up
    await get().loadEvents(event.date);
    // Record the location in history
    await recordLocationDb(event.location);
  },

  updateEvent: async (event) => {
    await updateEventDb(event);
    const { events } = get();
    const updated = events.map((e) => (e.id === event.id ? event : e));
    set({ events: updated });
  },

  deleteEvent: async (id) => {
    await deleteEventDb(id);
    const { events } = get();
    set({ events: events.filter((e) => e.id !== id) });
  },

  loadLocationHistory: async () => {
    const locationHistory = await getLocationHistory();
    set({ locationHistory });
  },

  recordLocation: async (location) => {
    await recordLocationDb(location);
    const locationHistory = await getLocationHistory();
    set({ locationHistory });
  },
}));
