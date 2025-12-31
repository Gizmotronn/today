import React from 'react';
import { Event } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { EventForm } from './EventForm';


interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<Event, 'id' | 'createdAt'> | Event) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  defaultDate: string;
  defaultProjectId?: string;
  event?: Event | null;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  defaultDate,
  defaultProjectId,
  event = null,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  if (!isOpen) return null;


  const handleSubmit = async (data: Omit<Event, 'id' | 'createdAt'> | Event) => {
    await onSubmit(data);
    onClose();
  };

  const handleDelete = async () => {
    if (event && onDelete) {
      const ok = window.confirm(`Delete event "${event.title}"?`);
      if (!ok) return;
      await onDelete(event.id);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          maxWidth: '90vw',
          width: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ padding: '24px' }}>
          <h2 style={{ color: colors.text, margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600' }}>
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <EventForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            defaultDate={defaultDate}
            defaultProjectId={defaultProjectId}
            event={event}
          />
          {event && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                marginTop: 16,
                backgroundColor: colors.card,
                color: colors.error,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '8px 12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                width: '100%',
              }}
            >
              Delete Event
            </button>
          )}
        </div>
      </div>
    </>
  );
};
