import React, { useEffect, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { ProjectModal } from './ProjectModal';
import { Project } from '../types';

export const Projects: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { projects, loadProjects, setSelectedProjectId, setSelectedTagId, setView } = useKanban();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const groupedProjects = projects.reduce((acc, project) => {
    if (!acc[project.group]) {
      acc[project.group] = [];
    }
    acc[project.group].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  const handleProjectClick = (projectId: string) => {
    setSelectedTagId(null);
    setSelectedProjectId(projectId);
    setView('board');
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusColor = (endDate: string) => {
    const days = getDaysLeft(endDate);
    if (days < 0) return colors.error;
    if (days < 7) return colors.warning;
    return colors.success;
  };

  return (
    <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>📊 Projects</h1>
        <button
          onClick={() => {
            setEditingProject(null);
            setShowModal(true);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.tint,
            color: colors.background,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + New Project
        </button>
      </div>

      <ProjectModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProject(null);
        }}
        project={editingProject}
      />

      {Object.keys(groupedProjects).length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: colors.muted,
          }}
        >
          No projects yet. Create one to get started!
        </div>
      ) : (
        Object.entries(groupedProjects).map(([group, groupProjects]) => (
          <div
            key={group}
            style={{
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: colors.muted,
              }}
            >
              {group}
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '12px',
              }}
            >
              {groupProjects.map((project) => {
                const daysLeft = getDaysLeft(project.endDate);

                const projectStatus = project.status ?? 'inProgress';
                const isCompleted = projectStatus === 'completed';
                const isPending = projectStatus === 'pending';

                const status = isCompleted
                  ? ''
                  : daysLeft < 0
                    ? '❌ Overdue'
                    : daysLeft === 0
                      ? '🔥 Today'
                      : `📅 ${daysLeft}d left`;

                const icon =
                  project.icon?.type === 'image' ? (
                    <img
                      src={project.icon.value}
                      alt=""
                      style={{ width: 20, height: 20, borderRadius: 7 }}
                    />
                  ) : (
                    <span style={{ width: 20, textAlign: 'center' }}>{project.icon?.value || '📌'}</span>
                  );

                return (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    style={{
                      backgroundColor: colors.card,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      opacity: isCompleted ? 0.7 : isPending ? 0.82 : 1,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setShowModal(true);
                      }}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.muted,
                        borderRadius: 8,
                        padding: '4px 8px',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                      title="Edit"
                      aria-label="Edit project"
                    >
                      Edit
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 8px 0' }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 10,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.background,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flex: '0 0 auto',
                          fontSize: 14,
                        }}
                      >
                        {icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '16px' }}>{project.name}</h3>
                    </div>

                    {(isCompleted || isPending) && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 16,
                          top: 16,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.background,
                          color: colors.muted,
                          fontSize: 12,
                          fontWeight: 650,
                        }}
                      >
                        {isCompleted ? 'Completed' : 'Pending'}
                      </div>
                    )}

                    {project.description && (
                      <p
                        style={{
                          margin: '0 0 12px 0',
                          fontSize: '13px',
                          color: colors.muted,
                          lineHeight: '1.4',
                        }}
                      >
                        {project.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: colors.muted }}>
                        {project.startDate} → {project.endDate}
                      </span>
                      {!isCompleted && (
                        <span style={{ color: getStatusColor(project.endDate), fontWeight: '500' }}>
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
