import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { Tag } from '../types';
import { useKanban } from '../store/kanban';
import { fileToFaviconDataUrl, urlToFaviconDataUrl } from '../lib/icon';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag?: Tag | null;
}

export const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose, tag }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { upsertTag, deleteTag } = useKanban();

  const [emoji, setEmoji] = useState<string>('');
  const [icon, setIcon] = useState<Tag['icon'] | null>(null);
  const [iconUrl, setIconUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (tag) {
      if (tag.icon?.type === 'emoji') setEmoji(tag.icon.value);
      else setEmoji('');
      setIcon(tag.icon ?? null);
      setIconUrl('');
    } else {
      setEmoji('');
      setIcon(null);
      setIconUrl('');
    }
  }, [isOpen, tag?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;

    const nextIcon = emoji.trim() ? ({ type: 'emoji', value: emoji } as const) : icon;
    await upsertTag({ id: tag.id, icon: nextIcon ?? undefined });
    onClose();
  };

  const handleDelete = async () => {
    if (!tag) return;
    const ok = window.confirm(`Delete tag "${tag.id}"?`);
    if (!ok) return;
    await deleteTag(tag.id);
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
        onSubmit={handleSave}
        style={{
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 20,
          width: '92%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{tag ? `Tag: ${tag.id}` : 'Tag'}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 10px',
              backgroundColor: colors.card,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
          >
            {icon?.type === 'image' ? (
              <img src={icon.value} alt="icon" style={{ width: 28, height: 28, borderRadius: 8 }} />
            ) : (
              <span style={{ fontSize: 18 }}>{emoji.trim() || icon?.value || '🏷️'}</span>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Emoji"
                value={emoji}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmoji(v);
                  if (v.trim()) setIcon({ type: 'emoji', value: v });
                }}
                style={{
                  width: 110,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.input,
                  color: colors.text,
                  fontSize: 14,
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
                    setEmoji('');
                    setIcon({ type: 'image', value: dataUrl });
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
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
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
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.input,
                  color: colors.text,
                  fontSize: 14,
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
                    setEmoji('');
                    setIcon({ type: 'image', value: dataUrl });
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
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  whiteSpace: 'nowrap',
                }}
              >
                Use URL
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmoji('');
                  setIcon(null);
                  setIconUrl('');
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: colors.card,
                  color: colors.muted,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                Clear
              </button>
            </div>
            <div style={{ color: colors.muted, fontSize: 12 }}>
              Tag names come from ticket tags. Icons are optional.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {tag && (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                padding: '8px 12px',
                backgroundColor: colors.card,
                color: colors.error,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Delete
            </button>
          )}

          <button
            type="submit"
            disabled={!tag}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: colors.tint,
              color: colors.background,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              opacity: tag ? 1 : 0.6,
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};
