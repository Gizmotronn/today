import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Ticket } from '../types';
import { TicketCard } from './TicketCard';
import { Colors, ColumnColors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface ColumnProps {
  title: string;
  columnKey: 'todo' | 'inProgress' | 'done';
  tickets: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
  onAdd?: () => void;
}

export const Column: React.FC<ColumnProps> = ({
  title,
  columnKey,
  tickets,
  onTicketClick,
  onAdd,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const colColor = ColumnColors[columnKey];

  const { setNodeRef, isOver } = useDroppable({ id: columnKey });

  return (
    <div
      className="boardColumn"
      style={{
        flex: 1,
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 14,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontWeight: 650,
          fontSize: 14,
          marginBottom: 12,
          color: colors.text,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              backgroundColor: colColor.border,
              color: colors.background,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              lineHeight: '16px',
            }}
          >
            {title}
          </span>
          <span style={{ color: colors.muted, fontSize: 12 }}>{tickets.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="columnDropArea"
        style={{
          flex: 1,
          border: `1px dashed ${isOver ? colColor.border : colors.border}`,
          borderRadius: 14,
          padding: 10,
          backgroundColor: isOver ? colors.input : colors.card,
          transition: 'background-color 0.2s, border-color 0.2s',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={onTicketClick}
          />
        ))}

        {tickets.length === 0 && (
          <div
            style={{
              color: colors.muted,
              fontSize: 12,
              padding: '8px 6px',
              textAlign: 'center',
            }}
          >
            Drop tickets here
          </div>
        )}

        {onAdd && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 6px 6px' }}>
            <button
              type="button"
              onClick={onAdd}
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.muted,
                fontSize: 18,
                lineHeight: '32px',
              }}
              aria-label={`Add to ${title}`}
              title={`Add to ${title}`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
