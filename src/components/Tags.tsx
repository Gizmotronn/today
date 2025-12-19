import React, { useEffect, useMemo, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { useKanban } from '../store/kanban';
import { Tag } from '../types';
import { TagModal } from './TagModal';

export const Tags: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { tags, loadTags, upsertTag } = useKanban();

  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => a.id.localeCompare(b.id));
  }, [tags]);

  const createTag = async () => {
    const id = newTag.trim();
    if (!id) return;
    await upsertTag({ id });
    setNewTag('');
  };

  const renderIcon = (tag: Tag) => {
    if (tag.icon?.type === 'image') {
      return (
        <img
          src={tag.icon.value}
          alt=""
          style={{ width: 20, height: 20, borderRadius: 6 }}
        />
      );
    }
    return <span style={{ width: 20, textAlign: 'center' }}>{tag.icon?.value || '🏷️'}</span>;
  };

  return (
    <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>🏷️ Tags</h1>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="New tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                createTag();
              }
            }}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 13,
              fontFamily: 'inherit',
              width: 220,
            }}
          />
          <button
            onClick={createTag}
            style={{
              padding: '10px 14px',
              backgroundColor: colors.tint,
              color: colors.background,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 650,
              fontSize: 13,
            }}
          >
            + Add
          </button>
        </div>
      </div>

      <TagModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTag(null);
        }}
        tag={editingTag}
      />

      {sortedTags.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: colors.muted }}>
          No tags yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          {sortedTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setEditingTag(tag);
                setShowModal(true);
              }}
              style={{
                textAlign: 'left',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                    overflow: 'hidden',
                  }}
                >
                  {renderIcon(tag)}
                </div>
                <div style={{ fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tag.id}
                </div>
              </div>

              <div style={{ color: colors.muted, fontSize: 13 }}>Edit</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
