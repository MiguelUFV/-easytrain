import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchStations } from '../../lib/api';
import type { Station } from '../../types';

interface StationSearchProps {
  placeholder: string;
  value: string;           // station ID (the actual search value)
  displayName?: string;    // human-readable name
  onChange: (id: string, name: string) => void;
  onSelect?: (station: Station) => void;
}

export const StationSearch: React.FC<StationSearchProps> = ({
  placeholder,
  value,
  displayName,
  onChange,
  onSelect
}) => {
  const [inputText, setInputText] = useState(displayName ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync with external value changes (e.g., swap button)
  useEffect(() => {
    if (displayName !== undefined && displayName !== inputText && !isOpen) {
      setInputText(displayName);
    }
    if (!value && inputText && !isOpen) {
      setInputText('');
      setSelectedStation(null);
    }
  }, [value, displayName]);

  // Fetch suggestions when typing
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!inputText.trim() || inputText.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await fetchStations(inputText.trim());
        setSuggestions(results);
        if (results.length > 0) setIsOpen(true);
      } catch (err) {
        console.warn('[StationSearch] Error buscando estaciones:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [inputText]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (station: Station) => {
    setSelectedStation(station);
    setInputText(station.name);
    setIsOpen(false);
    setSuggestions([]);
    onChange(station.id, station.name);
    if (onSelect) onSelect(station);
  };

  const handleClear = () => {
    setSelectedStation(null);
    setInputText('');
    onChange('', '');
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    // If user is typing again, clear the locked station so search allows retyping
    if (selectedStation && val !== selectedStation.name) {
      setSelectedStation(null);
      onChange('', val); // pass raw text as fallback so API can use it
    }
    setIsOpen(true);
  };

  return (
    <div className="flex-1 relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500/60" size={15} />
        <input
          type="text"
          placeholder={placeholder}
          className={`glass-input pl-9 pr-8 w-full text-sm ${selectedStation ? 'text-white font-semibold' : ''}`}
          value={inputText}
          onChange={handleInputChange}
          onFocus={async () => {
            if (!inputText.trim()) {
              // Show popular stations on focus (empty string returns the fallback list)
              setIsLoading(true);
              try {
                const defaults = await fetchStations('');
                setSuggestions(defaults.slice(0, 6));
                setIsOpen(true);
              } catch (err) {
                console.warn('[StationSearch] Error cargando estaciones populares:', err);
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsOpen(true);
            }
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400">
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
        {!isLoading && inputText && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors p-0.5"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 overflow-hidden shadow-2xl"
            style={{
              background: '#0d0f1a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
            }}
          >
            <div className="max-h-60 overflow-y-auto">
              {!inputText.trim() && (
                <div className="px-4 py-2 bg-white/5 border-b border-white/5">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400">Hubs Populares</span>
                </div>
              )}
              {suggestions.map((station) => (
                <button
                  key={station.id}
                  className="w-full px-4 py-3 text-left hover:bg-indigo-500/8 flex items-center gap-3 transition-colors border-b border-white/5 last:border-0 group"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(station);
                  }}
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 border border-indigo-500/15 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate">{station.name}</div>
                    <div className="text-[10px] text-gray-500 font-medium group-hover:text-gray-400 transition-colors">
                      {station.city} · {station.country}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
