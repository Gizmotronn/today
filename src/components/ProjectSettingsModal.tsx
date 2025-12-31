import React, { useState } from 'react';
import { Project } from '../types';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface ProjectSettingsModalProps {
  project: Project;
  onSave: (project: Project) => Promise<void>;
  onClose: () => void;
}

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#64748b', // Slate
  '#6b7280', // Gray
  '#78350f', // Brown
];

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  onSave,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [selectedColor, setSelectedColor] = useState(project.color || COLOR_PALETTE[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        ...project,
        color: selectedColor,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: colors.text, marginTop: 0, marginBottom: '16px' }}>
          {project.name} Settings
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: colors.text, fontSize: '14px', fontWeight: '500', display: 'block', marginBottom: '12px' }}>
            Project Color
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px',
            }}
          >
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundColor: color,
                  border: selectedColor === color ? `4px solid ${colors.text}` : '2px solid transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: colors.background,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: selectedColor,
              borderRadius: '6px',
            }}
          />
          <span style={{ color: colors.text, fontSize: '14px' }}>
            Preview: {selectedColor}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: selectedColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Saving...' : 'Save Color'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: colors.border,
              color: colors.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
