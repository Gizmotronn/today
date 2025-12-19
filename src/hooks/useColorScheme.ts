import { useEffect, useState } from 'react';
import type { ColorScheme } from '../constants/theme';

export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return scheme;
}
