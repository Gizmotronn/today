import React, { useEffect, useState } from 'react';
import { useKanban } from '../store/kanban';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Ticket, DayMood } from '../types';
import { getTicketsForDate } from '../lib/db';

interface DayDetailsModalProps {
  date: string;
  onClose: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, onClose }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { dayEntries, updateDayMood, projects } = useKanban();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const dayEntry = dayEntries.get(date);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 960px)');
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    const loadTickets = async () => {
      const dayTickets = await getTicketsForDate(date);
      setTickets(dayTickets);
    };
    loadTickets();
  }, [date]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleMoodClick = async (currentMood: DayMood | undefined) => {
    // Cycle through moods
    const moods: (DayMood | undefined)[] = [undefined, '🫤', '🙂', '🎈'];
    const currentIndex = currentMood ? moods.indexOf(currentMood) : 0;
    const nextIndex = (currentIndex + 1) % moods.length;
    await updateDayMood(date, moods[nextIndex]);
  };

  const completedTickets = tickets.filter((t) => t.status === 'done');
  const incompleteTickets = tickets.filter((t) => t.status !== 'done');

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  const containerStyle = isMobile
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }
    : {
        marginTop: 24,
      };

  const contentStyle = isMobile
    ? {
        backgroundColor: colors.background,
        borderRadius: 16,
        maxWidth: 600,
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto' as const,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${colors.border}`,
      }
    : {
        backgroundColor: colors.background,
        borderRadius: 16,
        maxWidth: 1400,
        width: '100%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${colors.border}`,
      };

  return (
    <div onClick={isMobile ? onClose : undefined} style={containerStyle}>
      <div onClick={(e) => e.stopPropagation()} style={contentStyle}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{formatDate(date)}</h2>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => handleMoodClick(dayEntry?.mood)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.card,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{dayEntry?.mood || '😐'}</span>
                <span>Change mood</span>
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              color: colors.text,
              cursor: 'pointer',
              fontSize: 18,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Completed Tickets */}
          {completedTickets.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: colors.text }}>
                ✓ Completed ({completedTickets.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedTickets.map((ticket) => {
                  const project = getProjectById(ticket.projectId);
                  return (
                    <div
                      key={ticket.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: colors.card,
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: 40,
                          borderRadius: 2,
                          backgroundColor: project?.color || colors.tint,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            textDecoration: 'line-through',
                            color: colors.muted,
                            marginBottom: 4,
                          }}
                        >
                          {ticket.title}
                        </div>
                        {project && (
                          <div style={{ fontSize: 12, color: colors.muted }}>
                            {project.icon?.value} {project.name}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Incomplete Tickets */}
          {incompleteTickets.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: colors.text }}>
                Incomplete ({incompleteTickets.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incompleteTickets.map((ticket) => {
                  const project = getProjectById(ticket.projectId);
                  const statusColors = {
                    todo: { bg: '#FEF3C7', text: '#92400E' },
                    inProgress: { bg: '#DBEAFE', text: '#1E40AF' },
                    done: { bg: '#DCFCE7', text: '#166534' },
                  };
                  const statusColor = statusColors[ticket.status];
                  return (
                    <div
                      key={ticket.id}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: colors.card,
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 4,
                          height: 40,
                          borderRadius: 2,
                          backgroundColor: project?.color || colors.tint,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: colors.text,
                            marginBottom: 4,
                          }}
                        >
                          {ticket.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {project && (
                            <div style={{ fontSize: 12, color: colors.muted }}>
                              {project.icon?.value} {project.name}
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                            }}
                          >
                            {ticket.status === 'todo'
                              ? 'To Do'
                              : ticket.status === 'inProgress'
                              ? 'In Progress'
                              : 'Done'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No tickets */}
          {tickets.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: colors.muted,
                fontSize: 14,
              }}
            >
              No tickets for this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
