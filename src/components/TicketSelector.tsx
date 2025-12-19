import React, { useState, useRef, useEffect } from 'react';
import { Ticket } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface TicketSelectorProps {
  placeholder: string;
  value: string; // comma-separated ticket IDs
  onChange: (value: string) => void;
  availableTickets: Ticket[];
  onEnterNoSuggestion?: () => void;
  style?: React.CSSProperties;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  placeholder,
  value,
  onChange,
  availableTickets,
  onEnterNoSuggestion,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setFilteredTickets([]);
      return;
    }

    const lower = input.toLowerCase();
    const selectedIds = value.split(',').map((v) => v.trim()).filter(Boolean);
    const filtered = availableTickets.filter(
      (t) =>
        (t.title.toLowerCase().includes(lower) ||
          t.id.toLowerCase().includes(lower)) &&
        !selectedIds.includes(t.id)
    );
    setFilteredTickets(filtered.slice(0, 10)); // Limit to 10 suggestions
    setIsOpen(filtered.length > 0);
  }, [input, availableTickets, value]);

  const handleSelect = (ticket: Ticket) => {
    const parts = value.split(',').map((v) => v.trim()).filter(Boolean);
    if (!parts.includes(ticket.id)) {
      parts.push(ticket.id);
    }
    onChange(parts.join(', '));
    setInput('');
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setIsOpen(filteredTickets.length > 0 || input.length > 0)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (isOpen && filteredTickets.length > 0) {
              e.preventDefault();
              handleSelect(filteredTickets[0]);
              return;
            }
            if (onEnterNoSuggestion) {
              e.preventDefault();
              onEnterNoSuggestion();
            }
          }
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
          ...style,
        }}
      />

      {isOpen && filteredTickets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            maxHeight: '250px',
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          {filteredTickets.map((ticket, index) => (
            <div
              key={ticket.id}
              onClick={() => handleSelect(ticket)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor:
                  index === 0 ? colors.input : colors.card,
                color: colors.text,
                fontSize: '13px',
                borderBottom:
                  index === filteredTickets.length - 1
                    ? 'none'
                    : `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  colors.input;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  colors.card;
              }}
            >
              <div style={{ fontWeight: '500' }}>{ticket.title}</div>
              <div
                style={{
                  fontSize: '11px',
                  color: colors.muted,
                }}
              >
                {ticket.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {value && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          {value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
            .map((ticketId) => {
              const ticket = availableTickets.find((t) => t.id === ticketId);
              return (
                <div
                  key={ticketId}
                  style={{
                    backgroundColor: colors.tint,
                    color: colors.background,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{ticket?.title || ticketId}</span>
                  <button
                    onClick={() => {
                      const parts = value
                        .split(',')
                        .map((v) => v.trim())
                        .filter((v) => v !== ticketId);
                      onChange(parts.join(', '));
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.background,
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
