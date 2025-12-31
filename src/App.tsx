import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Board } from './components/Board';
import { Archive } from './components/Archive';
import { SearchResults } from './components/SearchResults';
import { Projects } from './components/Projects';
import { ImportExport } from './components/ImportExport';
import { Tags } from './components/Tags';
import { Analytics } from './components/Analytics';
import { ProjectTickets } from './components/ProjectTickets';
import Calendar from './components/Calendar';
import { useKanban } from './store/kanban';
import { Colors } from './constants/theme';
import { useColorScheme } from './hooks/useColorScheme';
import './App.css';

function App() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { view, setView } = useKanban();

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 960px)');
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    // Mobile should default to the board (sidebar closed).
    if (isMobile) {
      setSidebarOpen(false);
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  const viewTitle = useMemo(() => {
    switch (view) {
      case 'board':
        return 'Board';
      case 'archive':
        return 'Archive';
      case 'search':
        return 'Search';
      case 'projects':
        return 'Projects';
      case 'importExport':
        return 'Import / Export';
      case 'tags':
        return 'Tags';
      case 'analytics':
        return 'Analytics';
      case 'projectTickets':
        return 'Project Tickets';
      case 'calendar':
        return 'Calendar';
      default:
        return 'Kanban';
    }
  }, [view]);

  useEffect(() => {
    // Initialize app
    console.log('Kanban app initialized');
  }, []);

  const handleViewChange = (
    newView:
      | 'board'
      | 'archive'
      | 'search'
      | 'projects'
      | 'importExport'
      | 'tags'
      | 'analytics'
      | 'projectTickets'
      | 'calendar'
  ) => {
    setView(newView);
  };

  return (
    <div
      className={`appShell${isMobile ? ' isMobile' : ''}${sidebarOpen ? ' sidebarOpen' : ''}${sidebarCollapsed ? ' sidebarCollapsed' : ''}`}
      style={{
        ['--text' as any]: colors.text,
        ['--background' as any]: colors.background,
        ['--card' as any]: colors.card,
        ['--input' as any]: colors.input,
        ['--border' as any]: colors.border,
        ['--muted' as any]: colors.muted,
        ['--tint' as any]: colors.tint,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {isMobile && sidebarOpen && (
        <div
          className="appOverlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {!isMobile && sidebarCollapsed && (
        <button
          type="button"
          className="desktopSidebarReopen"
          onClick={() => setSidebarCollapsed(false)}
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          ☰
        </button>
      )}

      <Sidebar
        onViewChange={handleViewChange}
        isMobile={isMobile}
        onNavigate={() => {
          if (isMobile) setSidebarOpen(false);
        }}
        onToggleCollapse={() => {
          if (!isMobile) setSidebarCollapsed((v) => !v);
        }}
        isCollapsed={!isMobile && sidebarCollapsed}
      />

      <div className="appMain" style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <div className="mobileHeader">
          <button
            type="button"
            className="mobileMenuButton"
            onClick={() => {
              if (isMobile) setSidebarOpen(true);
              else setSidebarCollapsed((v) => !v);
            }}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            ☰
          </button>
          <div className="mobileHeaderTitle">{viewTitle}</div>
        </div>

        <div className="mainContent">
          {view === 'board' && <Board />}
          {view === 'archive' && <Archive />}
          {view === 'search' && <SearchResults />}
          {view === 'projects' && <Projects />}
          {view === 'importExport' && <ImportExport />}
          {view === 'tags' && <Tags />}
          {view === 'analytics' && <Analytics />}
          {view === 'projectTickets' && <ProjectTickets />}
          {view === 'calendar' && <Calendar />}
        </div>
      </div>
    </div>
  );
}

export default App;
