import React from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { TicketCard } from './TicketCard';

export const SearchResults: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { tickets, searchQuery } = useKanban();

  return (
    <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>
        🔍 Search Results
      </h1>
      <p style={{ color: colors.muted, marginBottom: '20px' }}>
        {tickets.length} result{tickets.length !== 1 ? 's' : ''} for "{searchQuery}"
      </p>

      {tickets.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: colors.muted,
          }}
        >
          No tickets found.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                backgroundColor: colors.card,
                borderRadius: '12px',
                padding: '12px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <TicketCard ticket={ticket} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
