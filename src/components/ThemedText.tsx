import React, { ReactNode } from 'react';
import { useColorScheme } from '../hooks/useColorScheme';
import { Colors } from '../constants/theme';

interface ThemedTextProps {
  style?: React.CSSProperties;
  children: ReactNode;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ style, children }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <span
      style={{
        color: colors.text,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
