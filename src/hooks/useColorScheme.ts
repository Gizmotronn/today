import { useEffect, useState } from 'react';
import type { ColorScheme } from '../constants/theme';

type ColorSchemeHook = {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
};

export function useColorScheme(): ColorScheme {
  const [scheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem('colorScheme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('colorScheme', scheme);
  }, [scheme]);

  return scheme;
}

export function useColorSchemeWithToggle(): ColorSchemeHook {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem('colorScheme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('colorScheme', scheme);
  }, [scheme]);

  const toggleColorScheme = () => {
    setScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { colorScheme: scheme, toggleColorScheme };
}
