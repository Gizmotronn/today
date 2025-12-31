import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { Autocomplete } from './Autocomplete';
import { TicketSelector } from './TicketSelector';
import { Ticket } from '../types';

interface TicketModalProps {
  isOpen: boolean;
  defaultProjectId?: string | null;
  defaultDate: string;
  onClose: () => void;
  ticket?: Ticket | null;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  defaultProjectId,
  defaultDate,
  onClose,
  ticket,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { addTicket, updateTicket, tickets, projects, loadProjects } = useKanban();

  const titleRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const blockersAdvanceRef = useRef<(() => void) | null>(null);
  const requiredAdvanceRef = useRef<(() => void) | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    blockers: '',
    required: '',
    projectId: defaultProjectId ?? '',
    deferred: false,
    priority: false,
  });

  useEffect(() => {
    if (!isOpen) return;
    loadProjects();
  }, [isOpen, loadProjects]);

  useEffect(() => {
    if (!isOpen) return;
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description,
        tags: (ticket.tags || []).join(', ') + (ticket.tags?.length ? ', ' : ''),
        blockers: (ticket.blockers || []).join(', '),
        required: (ticket.required || []).join(', '),
        projectId: ticket.projectId || '',
        deferred: ticket.deferred || false,
        priority: ticket.priority || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        tags: '',
        blockers: '',
        required: '',
        projectId: defaultProjectId ?? '',
        deferred: false,
        priority: false,
      });
    }
    // Focus title on open
    setTimeout(() => titleRef.current?.focus(), 0);
  }, [isOpen, ticket?.id, defaultProjectId]);

  // Extract all unique tags from existing tickets
  const usedTags = useMemo(() => {
    const tags = new Set<string>();
    tickets.forEach((ticket) => {
      ticket.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const blockers = formData.blockers
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const required = formData.required
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (ticket) {
      await updateTicket({
        ...ticket,
        title: formData.title,
        description: formData.description,
        tags,
        blockers,
        required,
        projectId: formData.projectId,
        deferred: formData.deferred,
        priority: formData.priority,
      });
    } else {
      await addTicket({
        title: formData.title,
        description: formData.description,
        tags,
        projectId: formData.projectId,
        status: 'todo',
        date: defaultDate,
        blockers,
        required,
        deferred: formData.deferred,
        priority: formData.priority,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2 style={{ margin: 0, marginBottom: '12px' }}>{ticket ? 'Edit Ticket' : 'New Ticket'}</h2>

        <input
          ref={titleRef}
          type="text"
          placeholder="Ticket title"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              descRef.current?.focus();
            }
          }}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.input,
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        />

        <div>
          <label
            style={{
              fontSize: '12px',
              color: colors.muted,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Project
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.input,
              color: colors.text,
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.group ? `${p.group} — ${p.name}` : p.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          ref={descRef}
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.input,
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'inherit',
            minHeight: '80px',
            resize: 'vertical',
          }}
        />

        <div>
          <label
            style={{
              fontSize: '12px',
              color: colors.muted,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Tags
          </label>
          <Autocomplete
            placeholder="Type to add tags..."
            value={formData.tags}
            onChange={(value) =>
              setFormData({ ...formData, tags: value })
            }
            suggestions={usedTags}
            onEnterNoSuggestion={() => {
              // If no suggestion selected, move to blockers
              blockersAdvanceRef.current?.();
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: colors.muted,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Blockers (tickets that must be done first)
          </label>
          <TicketSelector
            placeholder="Type ticket title or ID..."
            value={formData.blockers}
            onChange={(value) =>
              setFormData({ ...formData, blockers: value })
            }
            availableTickets={tickets}
            onEnterNoSuggestion={() => {
              requiredAdvanceRef.current?.();
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '12px',
              color: colors.muted,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Required (tickets this depends on)
          </label>
          <TicketSelector
            placeholder="Type ticket title or ID..."
            value={formData.required}
            onChange={(value) =>
              setFormData({ ...formData, required: value })
            }
            availableTickets={tickets}
            onEnterNoSuggestion={() => {
              submitRef.current?.focus();
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.priority}
              onChange={(e) => {
                // If marking as priority, unmark deferred
                setFormData({ 
                  ...formData, 
                  priority: e.target.checked,
                  deferred: e.target.checked ? false : formData.deferred,
                });
              }}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: colors.text }}>🔴 Priority</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.deferred}
              onChange={(e) =>
                setFormData({ ...formData, deferred: e.target.checked })
              }
              disabled={formData.priority}
              style={{ cursor: formData.priority ? 'not-allowed' : 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: formData.priority ? colors.muted : colors.text }}>
              ⏸️ Deferred
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            ref={submitRef}
            type="submit"
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: colors.tint,
              color: colors.background,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            {ticket ? 'Save Ticket' : 'Add Ticket'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 12px',
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
