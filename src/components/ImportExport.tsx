import React, { useMemo, useRef, useState } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';
import { exportAll, importAll, ExportPayload } from '../lib/db';
import { useKanban } from '../store/kanban';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const ImportExport: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { loadProjects, loadTags, loadTickets, selectedDate, setSelectedProjectId, setSelectedTagId } =
    useKanban();

  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportFilename = useMemo(() => {
    const d = new Date();
    const ymd = d.toISOString().split('T')[0];
    return `kanban-export-${ymd}.json`;
  }, []);

  const handleExport = async () => {
    setStatus('Exporting…');
    try {
      const payload = await exportAll();
      downloadJson(exportFilename, payload);
      setStatus('Export complete.');
    } catch (e) {
      setStatus(`Export failed: ${String(e)}`);
    }
  };

  const handleImportFile = async (file: File) => {
    setStatus('Importing…');
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Partial<ExportPayload>;
      await importAll(payload);

      // Clear filters so people see their data immediately
      setSelectedProjectId(null);
      setSelectedTagId(null);

      await Promise.all([loadProjects(), loadTags(), loadTickets(selectedDate)]);
      setStatus('Import complete.');
    } catch (e) {
      setStatus(`Import failed: ${String(e)}`);
    }
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
        <h1 style={{ margin: 0, fontSize: '24px' }}>⇄ Import / Export</h1>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 720,
        }}
      >
        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 650, marginBottom: 4 }}>Export</div>
            <div style={{ color: colors.muted, fontSize: 13 }}>
              Download a JSON snapshot of all projects, tickets, archive, and tags.
            </div>
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 14px',
              backgroundColor: colors.tint,
              color: colors.background,
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 650,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            Export JSON
          </button>
        </div>

        <div
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 650, marginBottom: 4 }}>Import</div>
            <div style={{ color: colors.muted, fontSize: 13 }}>
              Select a JSON export to merge into your local data.
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await handleImportFile(file);
              } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 14px',
              backgroundColor: colors.background,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 650,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            Choose file…
          </button>
        </div>

        {status && (
          <div style={{ color: colors.muted, fontSize: 13, paddingLeft: 2 }}>{status}</div>
        )}
      </div>
    </div>
  );
};
