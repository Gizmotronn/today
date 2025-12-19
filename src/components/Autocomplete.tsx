import React, { useState, useRef, useEffect } from 'react';
import { Colors } from '../constants/theme';
import { useColorScheme } from '../hooks/useColorScheme';

interface AutocompleteProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  onEnterNoSuggestion?: () => void;
  style?: React.CSSProperties;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  onEnterNoSuggestion,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = value.split(',').pop()?.trim() ?? '';
    if (!current) {
      setFilteredSuggestions([]);
      return;
    }

    const lower = current.toLowerCase();
    const selected = value
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const filtered = suggestions.filter(
      (s) =>
        s.toLowerCase().includes(lower) &&
        s.toLowerCase() !== lower &&
        !selected.includes(s.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [value, suggestions]);

  const handleSelect = (suggestion: string) => {
    const parts = value.split(',');
    parts[parts.length - 1] = suggestion;
    const newValue = parts.join(',');
    onChange(newValue + ', ');
    onSuggestionSelect?.(suggestion);
    setIsOpen(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(filteredSuggestions.length > 0)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (isOpen && filteredSuggestions.length > 0) {
              e.preventDefault();
              handleSelect(filteredSuggestions[0]);
              return;
            }
            if (onEnterNoSuggestion) {
              e.preventDefault();
              onEnterNoSuggestion();
            }
          }
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px',
          fontFamily: 'inherit',
          ...style,
        }}
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            maxHeight: '200px',
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelect(suggestion)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor:
                  index === 0 ? colors.input : colors.card,
                color: colors.text,
                fontSize: '13px',
                borderBottom:
                  index === filteredSuggestions.length - 1
                    ? 'none'
                    : `1px solid ${colors.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  colors.input;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor =
                  colors.card;
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
