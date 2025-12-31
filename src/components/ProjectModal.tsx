import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { Autocomplete } from './Autocomplete';
import { Project } from '../types';
import { fileToFaviconDataUrl, urlToFaviconDataUrl } from '../lib/icon';

interface ProjectModalProps {
  isOpen?: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave?: (project: Project) => Promise<void>;
  onOpenSettings?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen = true,
  onClose,
  project,
  onSave: onSaveOverride,
  onOpenSettings,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { addProject, updateProject, deleteProject, projects } = useKanban();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [iconUrl, setIconUrl] = useState('');

  const todayYmd = () => new Date().toISOString().split('T')[0];
  const in30DaysYmd = () =>
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    group: '',
    description: '',
    startDate: todayYmd(),
    endDate: in30DaysYmd(),
    status: 'inProgress' as NonNullable<Project['status']>,
    icon: null as Project['icon'] | null,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (project) {
      setFormData({
        name: project.name ?? '',
        group: project.group ?? '',
        description: project.description ?? '',
        startDate: project.startDate ?? todayYmd(),
        endDate: project.endDate ?? in30DaysYmd(),
        status: project.status ?? 'inProgress',
        icon: project.icon ?? null,
      });
      setIconUrl('');
    } else {
      setFormData({
        name: '',
        group: '',
        description: '',
        startDate: todayYmd(),
        endDate: in30DaysYmd(),
        status: 'inProgress',
        icon: null,
      });
      setIconUrl('');
    }
  }, [isOpen, project?.id]);

  // Extract all unique groups from existing projects
  const usedGroups = useMemo(() => {
    return Array.from(
      new Set(projects.map((p) => p.group).filter((g) => Boolean(g)))
    ).sort();
  }, [projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Omit<Project, 'id' | 'createdAt'> = {
      name: formData.name,
      group: formData.group,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      icon: formData.icon ?? undefined,
      color: project?.color,
    };

    if (project) {
      const updated = {
        ...project,
        ...payload,
      };
      if (onSaveOverride) {
        await onSaveOverride(updated);
      } else {
        await updateProject(updated);
      }
    } else {
      await addProject(payload);
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!project) return;
    const ok = window.confirm(`Delete project "${project.name}"? (This also deletes its tickets)`);
    if (!ok) return;
    await deleteProject(project.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, marginBottom: '12px' }}>
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 10px',
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '999px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.input,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flex: '0 0 auto',
            }}
            title="Project icon"
          >
            {formData.icon?.type === 'image' ? (
              <img
                src={formData.icon.value}
                alt="icon"
                style={{ width: 28, height: 28, borderRadius: 8 }}
              />
            ) : (
              <span style={{ fontSize: 18 }}>{formData.icon?.value || '📌'}</span>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Emoji"
                value={formData.icon?.type === 'emoji' ? formData.icon.value : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({
                    ...formData,
                    icon: v.trim() ? { type: 'emoji', value: v } : null,
                  });
                }}
                style={{
                  width: 110,
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await fileToFaviconDataUrl(file, 32);
                    setFormData({
                      ...formData,
                      icon: { type: 'image', value: dataUrl },
                    });
                  } finally {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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
                Upload icon
              </button>

              <input
                type="text"
                placeholder="Icon URL"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.input,
                  color: colors.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />

              <button
                type="button"
                onClick={async () => {
                  const url = iconUrl.trim();
                  if (!url) return;
                  try {
                    const dataUrl = await urlToFaviconDataUrl(url, 32);
                    setFormData({
                      ...formData,
                      icon: { type: 'image', value: dataUrl },
                    });
                    setIconUrl('');
                  } catch (e) {
                    alert(`Could not use icon URL: ${String(e)}`);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: colors.card,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                }}
              >
                Use URL
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, icon: null })}
                style={{
                  padding: '8px 12px',
                  backgroundColor: colors.card,
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Clear
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: colors.muted,
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as NonNullable<Project['status']>,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.input,
                    color: colors.text,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="inProgress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Project name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
          autoFocus
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

        <div>
          <label
            style={{
              fontSize: '12px',
              color: colors.muted,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Group
          </label>
          <Autocomplete
            placeholder="Work, Personal, Q1 2026, etc."
            value={formData.group}
            onChange={(value) =>
              setFormData({ ...formData, group: value })
            }
            suggestions={usedGroups}
            onSuggestionSelect={(group) =>
              setFormData({ ...formData, group })
            }
          />
        </div>

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

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: colors.muted }}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.input,
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                marginTop: '4px',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '12px', color: colors.muted }}>
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.input,
                color: colors.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                marginTop: '4px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {project && (
            <>
              <button
                type="button"
                onClick={() => onOpenSettings?.()}
                style={{
                  padding: '8px 12px',
                  backgroundColor: colors.card,
                  color: colors.tint,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                ⚙️ Settings
              </button>
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: '8px 12px',
                  backgroundColor: colors.card,
                  color: colors.error,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Delete
              </button>
            </>
          )}

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
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            {project ? 'Save' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};
