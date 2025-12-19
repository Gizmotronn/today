import { create } from 'zustand';
import { Ticket, Project, Tag } from '../types';
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
} from '../lib/db';

interface KanbanStore {
  tickets: Ticket[];
  projects: Project[];
  tags: Tag[];
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
    | 'projectTickets';

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
}

export const useKanban = create<KanbanStore>((set, get) => ({
  tickets: [],
  projects: [],
  tags: [],
  selectedDate: new Date().toISOString().split('T')[0],
  selectedProjectId: null,
  selectedTagId: null,
  searchQuery: '',
  deferredTicket: null,
  view: 'board',

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
    await archiveTicketsDb(selectedDate, completed, incomplete);
    get().loadTickets(selectedDate);
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
}));
