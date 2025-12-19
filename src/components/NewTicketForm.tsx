import React, { useState } from 'react';
import { Ticket } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface NewTicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  defaultDate: string;
}

export const NewTicketForm: React.FC<NewTicketFormProps> = ({
  onSubmit,
  onCancel,
  defaultDate,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    projectId: '',
    blockers: '',
    required: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title: formData.title,
      description: formData.description,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      projectId: formData.projectId,
      status: 'todo',
      date: defaultDate,
      blockers: formData.blockers.split(',').map((t) => t.trim()).filter(Boolean),
      required: formData.required.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setFormData({
      title: '',
      description: '',
      tags: '',
      projectId: '',
      blockers: '',
      required: '',
    });
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
      <input
        type="text"
        placeholder="Ticket title"
        value={formData.title}
        onChange={(e) =>
          setFormData({ ...formData, title: e.target.value })
        }
        required
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      />

      <textarea
        placeholder="Description (optional)"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
          minHeight: '60px',
          resize: 'vertical',
        }}
      />

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={formData.tags}
        onChange={(e) =>
          setFormData({ ...formData, tags: e.target.value })
        }
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      />

      <input
        type="text"
        placeholder="Project ID"
        value={formData.projectId}
        onChange={(e) =>
          setFormData({ ...formData, projectId: e.target.value })
        }
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      />

      <input
        type="text"
        placeholder="Blocker ticket IDs (comma-separated)"
        value={formData.blockers}
        onChange={(e) =>
          setFormData({ ...formData, blockers: e.target.value })
        }
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      />

      <input
        type="text"
        placeholder="Required ticket IDs (comma-separated)"
        value={formData.required}
        onChange={(e) =>
          setFormData({ ...formData, required: e.target.value })
        }
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
        }}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: colors.tint,
            color: colors.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          Add Ticket
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 12px',
            backgroundColor: colors.card,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
