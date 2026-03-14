import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Minus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PassengerCounts } from '../types';

interface PassengerSelectorProps {
  value: PassengerCounts;
  onChange: (value: PassengerCounts) => void;
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPassengers = value.adults + value.children + value.infants;

  const updateCount = (type: keyof PassengerCounts, delta: number) => {
    const newVal = Math.max(type === 'adults' ? 1 : 0, value[type] + delta);
    onChange({ ...value, [type]: newVal });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input flex items-center justify-between gap-3 px-4 min-w-[180px]"
      >
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <span className="text-sm font-medium">
            {totalPassengers} {totalPassengers === 1 ? 'Pasajero' : 'Pasajeros'}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-72 glass-card p-4 z-50 shadow-2xl border border-white/10"
          >
            <div className="space-y-6">
              <Counter
                label="Adultos"
                description="13+ años"
                count={value.adults}
                onIncrement={() => updateCount('adults', 1)}
                onDecrement={() => updateCount('adults', -1)}
                min={1}
              />
              <Counter
                label="Niños"
                description="2 - 12 años"
                count={value.children}
                onIncrement={() => updateCount('children', 1)}
                onDecrement={() => updateCount('children', -1)}
              />
              <Counter
                label="Bebés"
                description="Menos de 2 años"
                count={value.infants}
                onIncrement={() => updateCount('infants', 1)}
                onDecrement={() => updateCount('infants', -1)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CounterProps {
  label: string;
  description: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
}

const Counter = ({ label, description, count, onIncrement, onDecrement, min = 0 }: CounterProps) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-bold text-white">{label}</div>
      <div className="text-[10px] text-gray-400">{description}</div>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={onDecrement}
        disabled={count <= min}
        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
      >
        <Minus size={14} />
      </button>
      <span className="w-4 text-center text-sm font-bold text-white">{count}</span>
      <button
        onClick={onIncrement}
        className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  </div>
);
