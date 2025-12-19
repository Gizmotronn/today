import React, { useEffect, useMemo, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { getArchive, getProjects, getTags, getTicketsForDate } from '../lib/db';

type Counts = {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
};

export const Analytics: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { selectedDate } = useKanban();

  const [ticketCounts, setTicketCounts] = useState<Counts>({
    todo: 0,
    inProgress: 0,
    done: 0,
    total: 0,
  });
  const [projectCounts, setProjectCounts] = useState({
    inProgress: 0,
    pending: 0,
    completed: 0,
    total: 0,
  });
  const [tagCount, setTagCount] = useState(0);
  const [archiveDays, setArchiveDays] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [tickets, projects, tags, archive] = await Promise.all([
        getTicketsForDate(selectedDate),
        getProjects(),
        getTags(),
        getArchive(),
      ]);

      if (cancelled) return;

      const counts: Counts = {
        todo: tickets.filter((t) => t.status === 'todo').length,
        inProgress: tickets.filter((t) => t.status === 'inProgress').length,
        done: tickets.filter((t) => t.status === 'done').length,
        total: tickets.length,
      };

      const p = projects.map((pr) => pr.status ?? 'inProgress');
      const pc = {
        inProgress: p.filter((s) => s === 'inProgress').length,
        pending: p.filter((s) => s === 'pending').length,
        completed: p.filter((s) => s === 'completed').length,
        total: projects.length,
      };

      setTicketCounts(counts);
      setProjectCounts(pc);
      setTagCount(tags.length);
      setArchiveDays(archive.length);
    })().catch(() => {
      if (cancelled) return;
      setTicketCounts({ todo: 0, inProgress: 0, done: 0, total: 0 });
      setProjectCounts({ inProgress: 0, pending: 0, completed: 0, total: 0 });
      setTagCount(0);
      setArchiveDays(0);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const statCards = useMemo(
    () => [
      { label: 'Tickets today', value: ticketCounts.total },
      { label: 'To do', value: ticketCounts.todo },
      { label: 'In progress', value: ticketCounts.inProgress },
      { label: 'Done', value: ticketCounts.done },
      { label: 'Projects', value: projectCounts.total },
      { label: 'Completed projects', value: projectCounts.completed },
      { label: 'Tags', value: tagCount },
      { label: 'Archived days', value: archiveDays },
    ],
    [ticketCounts, projectCounts, tagCount, archiveDays]
  );

  return (
    <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📈 Analytics</h1>
          <div style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>For {selectedDate}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          maxWidth: 980,
        }}
      >
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ color: colors.muted, fontSize: 12, marginBottom: 6, fontWeight: 650 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-0.02em' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
