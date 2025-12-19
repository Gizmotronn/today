export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFF',
    tint: '#0a7ea4',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
    border: '#E5E7EB',
    card: '#F9FAFB',
    input: '#FFFBF2',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    muted: '#9CA3AF',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#77D4FF',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#77D4FF',
    border: '#38434D',
    card: '#1F2937',
    input: '#111827',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    muted: '#6B7280',
  },
};

export const ColumnColors = {
  todo: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  inProgress: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  done: { bg: '#DCFCE7', border: '#10B981', text: '#166534' },
};

export type ColorScheme = keyof typeof Colors;
