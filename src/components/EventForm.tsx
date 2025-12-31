import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';

interface EventFormProps {
  onSubmit: (event: Omit<Event, 'id' | 'createdAt'> | Event) => Promise<void>;
  onCancel: () => void;
  defaultDate: string;
  defaultProjectId?: string;
  event?: Event | null;
}

export const EventForm: React.FC<EventFormProps> = ({
  onSubmit,
  onCancel,
  defaultDate,
  defaultProjectId = '',
  event = null,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { locationHistory, loadLocationHistory, projects } = useKanban();
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  useEffect(() => {
    loadLocationHistory();
  }, [loadLocationHistory]);


  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || '',
    time: event?.time || '',
    projectId: event?.projectId || defaultProjectId,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        location: event.location,
        time: event.time || '',
        projectId: event.projectId,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        time: '',
        projectId: defaultProjectId,
      });
    }
  }, [event, defaultProjectId]);

  const filteredLocations = formData.location.trim()
    ? locationHistory.filter((loc) =>
        loc.location.toLowerCase().includes(formData.location.toLowerCase())
      )
    : locationHistory;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (event) {
      await onSubmit({
        ...event,
        ...formData,
      });
    } else {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        time: formData.time || undefined,
        date: defaultDate,
        projectId: formData.projectId,
      });
      setFormData({
        title: '',
        description: '',
        location: '',
        time: '',
        projectId: defaultProjectId,
      });
    }
    setShowLocationSuggestions(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div>
        <label style={{ color: colors.text, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Event Title *
        </label>
        <input
          type="text"
          placeholder="Event name"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            color: colors.text,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ color: colors.text, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Time
        </label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            color: colors.text,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ color: colors.text, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Location *
        </label>
        <input
          type="text"
          placeholder="Event location"
          value={formData.location}
          onChange={(e) => {
            setFormData({ ...formData, location: e.target.value });
            setShowLocationSuggestions(true);
          }}
          onFocus={() => setShowLocationSuggestions(true)}
          onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 100)}
          required
          autoComplete="off"
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            color: colors.text,
            boxSizing: 'border-box',
          }}
        />
        {showLocationSuggestions && filteredLocations.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              marginTop: '4px',
              zIndex: 10,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {filteredLocations.map((loc) => (
              <button
                key={loc.location}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, location: loc.location });
                  setShowLocationSuggestions(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: colors.card,
                  color: colors.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.border;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.card;
                }}
              >
                {loc.location}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label style={{ color: colors.text, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Description
        </label>
        <textarea
          placeholder="Event details"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            color: colors.text,
            boxSizing: 'border-box',
            minHeight: '60px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      <div>
        <label style={{ color: colors.text, fontSize: '12px', display: 'block', marginBottom: '4px' }}>
          Project *
        </label>
        <select
          value={formData.projectId}
          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            backgroundColor: colors.background,
            color: colors.text,
            boxSizing: 'border-box',
          }}
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: colors.tint,
            color: colors.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {event ? 'Save' : 'Create Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: colors.border,
            color: colors.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
