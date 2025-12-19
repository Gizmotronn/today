import React, { ReactNode } from 'react';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';

interface ThemedViewProps {
  style?: React.CSSProperties;
  children: ReactNode;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ style, children }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <div
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
