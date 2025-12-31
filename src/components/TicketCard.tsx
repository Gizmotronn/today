import React, { useMemo, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Ticket } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { deleteTicket, updateTicket, projects } = useKanban();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  });

  const [isHovered, setIsHovered] = useState(false);

  // Distinguish click vs drag so a drag doesn’t open the modal.
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const pointerMovedRef = useRef(false);

  const projectName = useMemo(() => {
    const project = projects.find((p) => p.id === ticket.projectId);
    return project?.name || '';
  }, [projects, ticket.projectId]);

  const handleToggleDeferred = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await updateTicket({
      ...ticket,
      deferred: !ticket.deferred,
    });
  };

  const handleTogglePriority = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // If marking as priority, also unmark as deferred
    await updateTicket({
      ...ticket,
      priority: !ticket.priority,
      deferred: ticket.priority ? ticket.deferred : false,
    });
  };

  return (
    <div
      ref={setNodeRef}
      className="ticketCard"
      {...attributes}
      {...listeners}
      onPointerDownCapture={(e) => {
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
        pointerMovedRef.current = false;
      }}
      onPointerMoveCapture={(e) => {
        if (!pointerDownRef.current) return;
        const dx = e.clientX - pointerDownRef.current.x;
        const dy = e.clientY - pointerDownRef.current.y;
        if (Math.hypot(dx, dy) > 5) pointerMovedRef.current = true;
      }}
      onPointerUpCapture={() => {
        pointerDownRef.current = null;
      }}
      onClick={() => {
        if (pointerMovedRef.current) return;
        onClick?.(ticket);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: '12px 12px 10px',
        marginBottom: 8,
        cursor: isDragging ? 'grabbing' : 'grab',
        // When dragging, hide the original so the overlay is what you see.
        opacity: isDragging ? 0 : 1,
        transition: isDragging ? 'opacity 0.08s' : 'box-shadow 0.2s, transform 0.2s, opacity 0.2s',
        userSelect: 'none',
        touchAction: 'none',
        boxShadow: isDragging
          ? '0 2px 0 rgba(0,0,0,0.04)'
          : isHovered
            ? '0 8px 24px rgba(0,0,0,0.08)'
            : '0 1px 0 rgba(0,0,0,0.04)',
      }}
    >
      <button
        type="button"
        aria-label="Delete ticket"
        onPointerDown={(e) => {
          // Prevent DnD kit from treating this as a drag start.
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          deleteTicket(ticket.id);
        }}
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          width: 26,
          height: 26,
          borderRadius: 999,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          color: colors.text,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          opacity: isHovered ? 1 : 0.7,
        }}
      >
        🗑️
      </button>

      <button
        type="button"
        aria-label={ticket.priority ? 'Unmark as priority' : 'Mark as priority'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleTogglePriority}
        style={{
          position: 'absolute',
          right: 42,
          top: 10,
          width: 26,
          height: 26,
          borderRadius: 999,
          border: `2px solid ${ticket.priority ? '#DC2626' : colors.border}`,
          backgroundColor: ticket.priority ? '#DC2626' : colors.background,
          color: ticket.priority ? 'white' : colors.text,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          opacity: isHovered ? 1 : 0.7,
          fontWeight: 'bold',
        }}
      >
        🔴
      </button>

      <button
        type="button"
        aria-label={ticket.deferred ? 'Unmark as deferred' : 'Mark as deferred'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleToggleDeferred}
        style={{
          position: 'absolute',
          right: 74,
          top: 10,
          width: 26,
          height: 26,
          borderRadius: 999,
          border: `2px solid ${ticket.deferred ? colors.muted : colors.border}`,
          backgroundColor: ticket.deferred ? colors.card : colors.background,
          color: colors.text,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          opacity: isHovered ? 1 : 0.7,
        }}
      >
        ⏸️
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: '18px',
            color: colors.text,
            paddingRight: 100,
            wordBreak: 'break-word',
          }}
        >
          {ticket.title}
        </div>
      </div>

      {ticket.description && (
        <div
          style={{
            fontSize: 12,
            color: colors.muted,
            lineHeight: '16px',
            marginBottom: 8,
            wordBreak: 'break-word',
          }}
        >
          {ticket.description}
        </div>
      )}

      {projectName && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              color: colors.text,
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: '16px',
            }}
          >
            📁 {projectName}
          </span>
        </div>
      )}

      {ticket.tags && ticket.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {ticket.tags.map((tag) => (
            <span
              key={tag}
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                color: colors.muted,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                lineHeight: '16px',
              }}
            >
              🏷️ {tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: colors.muted,
        }}
      >
        <span>{ticket.projectId || '—'}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {ticket.blockers?.length ? <span>🔒 {ticket.blockers.length}</span> : null}
          {ticket.required?.length ? <span>⛓️ {ticket.required.length}</span> : null}
        </div>
      </div>
    </div>
  );
};
