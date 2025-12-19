import React, { useEffect, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { Project, Ticket } from '../types';
import { getProjectById } from '../lib/db';
import { TicketModal } from './TicketModal';

export const ProjectTickets: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const {
    tickets,
    selectedProjectId,
    selectedDate,
    loadTickets,
    deleteTicket,
  } = useKanban();

  const [project, setProject] = useState<Project | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (selectedProjectId) {
      getProjectById(selectedProjectId).then((p: Project | undefined) => {
        if (p) setProject(p);
      });
    } else {
      setProject(null);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTickets(selectedDate);
  }, [selectedDate, selectedProjectId, loadTickets]);

  const activeTickets = tickets.filter((t) => t.status !== 'done');
  const closedTickets = tickets.filter((t) => t.status === 'done');

  const openNewTicket = () => {
    setEditingTicket(null);
    setShowModal(true);
  };

  const openEditTicket = (t: Ticket) => {
    setEditingTicket(t);
    setShowModal(true);
  };

  const renderTicketRow = (ticket: Ticket) => {
    const statusLabel =
      ticket.status === 'todo' ? 'To Do' : ticket.status === 'inProgress' ? 'In Progress' : 'Done';

    return (
      <div
        key={ticket.id}
        onClick={() => openEditTicket(ticket)}
        style={{
          padding: '14px 16px',
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          marginBottom: 8,
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: colors.text }}>
              {ticket.title}
            </div>
            {ticket.description && (
              <div
                style={{
                  fontSize: 13,
                  color: colors.muted,
                  lineHeight: 1.4,
                  marginBottom: 6,
                }}
              >
                {ticket.description}
              </div>
            )}
            {ticket.tags && ticket.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      padding: '2px 8px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                backgroundColor:
                  ticket.status === 'done'
                    ? colors.card
                    : ticket.status === 'inProgress'
                    ? colors.tint
                    : colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {statusLabel}
            </span>
            <button
              type="button"
              aria-label="Delete ticket"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this ticket?')) {
                  deleteTicket(ticket.id);
                }
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              🗑️
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: colors.muted }}>
          {new Date(ticket.createdAt).toLocaleDateString()}
          {ticket.completedAt && (
            <> • Completed {new Date(ticket.completedAt).toLocaleDateString()}</>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: colors.input,
      }}
    >
      <div
        style={{
          padding: '18px 22px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div
              style={{
                fontSize: 12,
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: '4px 10px',
                backgroundColor: colors.background,
              }}
            >
              Project
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {project?.icon && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flex: '0 0 auto',
                }}
              >
                {project.icon.type === 'image' ? (
                  <img
                    src={project.icon.value}
                    alt=""
                    style={{ width: 18, height: 18, borderRadius: 6 }}
                  />
                ) : (
                  <span style={{ fontSize: 16 }}>{project.icon.value}</span>
                )}
              </div>
            )}
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 650,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {project?.name || 'Project'}
            </h1>
          </div>

          {project?.description && (
            <div style={{ marginTop: 6, fontSize: 13, color: colors.muted }}>
              {project.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={openNewTicket}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: '38px',
            }}
            aria-label="Add ticket"
            title="Add ticket"
          >
            +
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '18px 22px',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 650,
              marginBottom: 12,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Active Tickets
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                backgroundColor: colors.card,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {activeTickets.length}
            </span>
          </h2>
          {activeTickets.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: colors.muted,
                fontSize: 14,
              }}
            >
              No active tickets
            </div>
          ) : (
            <div>{activeTickets.map(renderTicketRow)}</div>
          )}
        </div>

        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 650,
              marginBottom: 12,
              color: colors.text,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Closed Tickets
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                backgroundColor: colors.card,
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {closedTickets.length}
            </span>
          </h2>
          {closedTickets.length === 0 ? (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: colors.muted,
                fontSize: 14,
              }}
            >
              No closed tickets
            </div>
          ) : (
            <div>{closedTickets.map(renderTicketRow)}</div>
          )}
        </div>
      </div>

      <TicketModal
        isOpen={showModal}
        defaultProjectId={selectedProjectId}
        defaultDate={selectedDate}
        ticket={editingTicket}
        onClose={() => {
          setShowModal(false);
          setEditingTicket(null);
        }}
      />
    </div>
  );
};
