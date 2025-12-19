import React, { useState } from 'react';
import { Ticket } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface DeferZoneProps {
  deferredTicket: Ticket | null;
  onClear: () => void;
  onMoveToDate: (ticketId: string, date: string) => Promise<void>;
}

export const DeferZone: React.FC<DeferZoneProps> = ({
  deferredTicket,
  onClear,
  onMoveToDate,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [showPicker, setShowPicker] = useState(false);

  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextMonday = () => {
    const d = new Date();
    const dayOfWeek = d.getDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    return d.toISOString().split('T')[0];
  };

  if (!deferredTicket) {
    return (
      <div
        style={{
          minHeight: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: colors.card,
          border: `2px dashed ${colors.muted}`,
          borderRadius: '12px',
          textAlign: 'center',
          color: colors.muted,
          fontSize: '14px',
        }}
      >
        Drag a ticket here to defer it
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: colors.input,
        border: `2px solid ${colors.warning}`,
        borderRadius: '12px',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          opacity: 0.6,
        }}
      >
        📅 {deferredTicket.title}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button
          onClick={() => onMoveToDate(deferredTicket.id, getTomorrow())}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.tint,
            color: colors.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '13px',
          }}
        >
          Tomorrow
        </button>
        <button
          onClick={() => onMoveToDate(deferredTicket.id, getNextMonday())}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.tint,
            color: colors.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '13px',
          }}
        >
          Next Monday ({getNextMonday()})
        </button>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '13px',
          }}
        >
          Custom Date
        </button>

        {showPicker && (
          <input
            type="date"
            onChange={(e) => {
              if (e.target.value) {
                onMoveToDate(deferredTicket.id, e.target.value);
                setShowPicker(false);
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.input,
              color: colors.text,
            }}
          />
        )}

        <button
          onClick={onClear}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '13px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
