import React, { useEffect, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { db } from '../lib/db';
import { ArchiveEntry } from '../types';

export const Archive: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    const data = await db.archive.orderBy('completedDate').reverse().toArray();
    setArchives(data);
  };

  return (
    <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>📦 Archive</h1>

      {archives.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: colors.muted,
          }}
        >
          No archived tickets yet.
        </div>
      ) : (
        archives.map((archive) => (
          <div
            key={archive.id}
            style={{
              marginBottom: '24px',
              backgroundColor: colors.card,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
              {new Date(archive.completedDate + 'T00:00:00Z').toLocaleDateString(
                'en-US',
                {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                }
              )}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {archive.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: colors.input,
                    borderRadius: '6px',
                    fontSize: '13px',
                    opacity: 0.7,
                  }}
                >
                  <div style={{ fontWeight: '500' }}>{ticket.title}</div>
                  {ticket.description && (
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {ticket.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
