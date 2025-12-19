import React, { useEffect, useMemo, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { Project, Tag } from '../types';

interface SidebarProps {
  onViewChange: (
    view:
      | 'board'
      | 'archive'
      | 'search'
      | 'projects'
      | 'importExport'
      | 'tags'
      | 'analytics'
      | 'projectTickets'
  ) => void;
  isMobile?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onViewChange, isMobile, onNavigate, onToggleCollapse }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const {
    view,
    search,
    setSelectedProjectId,
    setSelectedTagId,
    selectedProjectId,
    selectedTagId,
    projects,
    tags,
    loadProjects,
    loadTags,
  } = useKanban();

  const [searchInput, setSearchInput] = useState('');
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  useEffect(() => {
    loadProjects();
    loadTags();
  }, [loadProjects, loadTags]);

  const renderIcon = (icon: Project['icon'] | Tag['icon'] | undefined) => {
    if (icon?.type === 'image') {
      return (
        <img
          src={icon.value}
          alt=""
          style={{ width: 18, height: 18, borderRadius: 6 }}
        />
      );
    }
    return <span style={{ width: 18, textAlign: 'center' }}>{icon?.value || '•'}</span>;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.status !== 'completed' && p.status !== 'pending');
  }, [projects]);

  const sortedProjects = useMemo(() => {
    return filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredProjects]);

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => a.id.localeCompare(b.id));
  }, [tags]);

  const handleSearch = async (query: string) => {
    setSelectedProjectId(null);
    setSelectedTagId(null);
    if (!query.trim()) {
      await search('');
      onViewChange('board');
    } else {
      await search(query);
      onViewChange('search');
    }
  };

  const handleBoardClick = () => {
    setSelectedProjectId(null);
    setSelectedTagId(null);
    onViewChange('board');
    onNavigate?.();
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedTagId(null);
    setSelectedProjectId(projectId);
    onViewChange('projectTickets');
    onNavigate?.();
  };

  const handleSelectTag = (tagId: string | null) => {
    setSelectedProjectId(null);
    setSelectedTagId(tagId);
    onViewChange('board');
    onNavigate?.();
  };

  return (
    <div
      className="sidebar"
      style={{
        width: 268,
        backgroundColor: colors.background,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        padding: '18px 14px',
        gap: '14px',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          ⬛
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '18px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            NotOnce
          </div>
          <div style={{ fontSize: 12, color: colors.muted, lineHeight: '16px' }}>
            Personal workspace
          </div>
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={() => onToggleCollapse?.()}
            className="sidebarItem"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.muted,
              fontSize: 14,
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            ⇤
          </button>
        )}
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: colors.border,
          opacity: 0.8,
          margin: '6px 0 2px',
        }}
      />

      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13,
            color: colors.muted,
          }}
        >
          🔎
        </span>
        <input
          type="text"
          placeholder="Search"
          value={isMobile ? searchInput : undefined}
          onChange={(e) => {
            if (isMobile) {
              setSearchInput(e.target.value);
            } else {
              handleSearch(e.target.value);
            }
          }}
          onKeyDown={(e) => {
            if (!isMobile) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(searchInput);
              onNavigate?.();
            }
          }}
          style={{
            width: '100%',
            padding: '10px 12px 10px 34px',
            borderRadius: 999,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.card,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        <div>
          <button
            className="sidebarItem"
            onClick={handleBoardClick}
            style={{
              padding: '10px 10px',
              textAlign: 'left',
              backgroundColor: view === 'board' ? colors.card : 'transparent',
              border: `1px solid ${view === 'board' ? colors.border : 'transparent'}`,
              borderRadius: 10,
              color: colors.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'inherit',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
            }}
          >
            <span style={{ width: 18, textAlign: 'center' }}>📋</span>
            Board
          </button>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          className="sidebarItem"
          type="button"
          onClick={() => {
            onViewChange('archive');
            onNavigate?.();
          }}
          style={{
            padding: '10px 10px',
            textAlign: 'left',
            backgroundColor: view === 'archive' ? colors.card : 'transparent',
            border: `1px solid ${view === 'archive' ? colors.border : 'transparent'}`,
            borderRadius: 10,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, textAlign: 'center' }}>📦</span>
          Archive
        </button>

        <button
          className="sidebarItem"
          type="button"
          onClick={() => {
            onViewChange('projects');
            onNavigate?.();
          }}
          style={{
            padding: '10px 10px',
            textAlign: 'left',
            backgroundColor: view === 'projects' ? colors.card : 'transparent',
            border: `1px solid ${view === 'projects' ? colors.border : 'transparent'}`,
            borderRadius: 10,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, textAlign: 'center' }}>🗂️</span>
          Project settings
        </button>

        <button
          className="sidebarItem"
          type="button"
          onClick={() => {
            onViewChange('tags');
            onNavigate?.();
          }}
          style={{
            padding: '10px 10px',
            textAlign: 'left',
            backgroundColor: view === 'tags' ? colors.card : 'transparent',
            border: `1px solid ${view === 'tags' ? colors.border : 'transparent'}`,
            borderRadius: 10,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, textAlign: 'center' }}>🏷️</span>
          Tag settings
        </button>

        <button
          className="sidebarItem"
          type="button"
          onClick={() => {
            onViewChange('importExport');
            onNavigate?.();
          }}
          style={{
            padding: '10px 10px',
            textAlign: 'left',
            backgroundColor: view === 'importExport' ? colors.card : 'transparent',
            border: `1px solid ${view === 'importExport' ? colors.border : 'transparent'}`,
            borderRadius: 10,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, textAlign: 'center' }}>⇄</span>
          Import / Export
        </button>

        <button
          className="sidebarItem"
          type="button"
          onClick={() => {
            onViewChange('analytics');
            onNavigate?.();
          }}
          style={{
            padding: '10px 10px',
            textAlign: 'left',
            backgroundColor: view === 'analytics' ? colors.card : 'transparent',
            border: `1px solid ${view === 'analytics' ? colors.border : 'transparent'}`,
            borderRadius: 10,
            color: colors.text,
            fontSize: 13,
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, textAlign: 'center' }}>📈</span>
          Analytics
        </button>
      </nav>

      <div style={{ height: 1, backgroundColor: colors.border, opacity: 0.8, margin: '10px 0 6px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto', minHeight: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="sidebarItem"
              onClick={handleBoardClick}
              style={{
                padding: '10px 10px',
                textAlign: 'left',
                backgroundColor: view === 'board' ? colors.card : 'transparent',
                border: `1px solid ${view === 'board' ? colors.border : 'transparent'}`,
                borderRadius: 10,
                color: colors.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                flex: 1,
                minWidth: 0,
              }}
            >
              <span style={{ width: 18, textAlign: 'center' }}>📋</span>
              Board
            </button>

            <button
              type="button"
              className="sidebarItem"
              onClick={() => setProjectsExpanded((v) => !v)}
              aria-label={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
              title={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.muted,
                fontSize: 14,
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {projectsExpanded ? '▾' : '▸'}
            </button>
          </div>

          {projectsExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6, paddingLeft: 16 }}>
              {sortedProjects.length === 0 ? (
                <div style={{ color: colors.muted, fontSize: 12, padding: '6px 2px' }}>No projects</div>
              ) : (
                sortedProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="sidebarItem"
                    onClick={() => handleSelectProject(p.id)}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      backgroundColor: selectedProjectId === p.id ? colors.card : 'transparent',
                      border: `1px solid ${selectedProjectId === p.id ? colors.border : 'transparent'}`,
                      borderRadius: 10,
                      color: colors.text,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                    }}
                    title={p.name}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 9,
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flex: '0 0 auto',
                        fontSize: 13,
                      }}
                    >
                      {renderIcon(p.icon)}
                    </div>
                    <div
                      style={{
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: 600,
                      }}
                    >
                      {p.name}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div style={{ height: 1, backgroundColor: colors.border, opacity: 0.8, margin: '10px 0 6px' }} />

        <div>
          <button
            type="button"
            className="sidebarItem"
            onClick={() => setTagsExpanded((v) => !v)}
            aria-label={tagsExpanded ? 'Collapse tags' : 'Expand tags'}
            title={tagsExpanded ? 'Collapse tags' : 'Expand tags'}
            style={{
              fontSize: 12,
              color: colors.muted,
              fontWeight: 650,
              marginBottom: 8,
              padding: '8px 10px',
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <span>Tags</span>
            <span style={{ color: colors.muted, fontSize: 14 }}>{tagsExpanded ? '▾' : '▸'}</span>
          </button>

          {tagsExpanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
              <button
                className="sidebarItem"
                type="button"
                onClick={() => handleSelectTag(null)}
                style={{
                  padding: '8px 10px',
                  textAlign: 'left',
                  backgroundColor: selectedTagId === null ? colors.card : 'transparent',
                  border: `1px solid ${selectedTagId === null ? colors.border : 'transparent'}`,
                  borderRadius: 10,
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 9,
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                    fontSize: 13,
                  }}
                >
                  •
                </div>
                All tags
              </button>

              {sortedTags.map((t) => (
                <button
                  className="sidebarItem"
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTag(t.id)}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    backgroundColor: selectedTagId === t.id ? colors.card : 'transparent',
                    border: `1px solid ${selectedTagId === t.id ? colors.border : 'transparent'}`,
                    borderRadius: 10,
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                  }}
                  title={t.id}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 9,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flex: '0 0 auto',
                      fontSize: 13,
                    }}
                  >
                    {renderIcon(t.icon)}
                  </div>
                  <div
                    style={{
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontWeight: 600,
                    }}
                  >
                    {t.id}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
