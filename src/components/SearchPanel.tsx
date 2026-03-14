import { useState } from 'react';
import { Calendar, Search, ArrowRightLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { StationSearch } from './StationSearch';
import { PassengerSelector } from './PassengerSelector';
import type { PassengerCounts, Station } from '../types';

interface SearchPanelProps {
  onSearch: (params: {
    from: string;
    fromStation?: Station;
    to: string;
    toStation?: Station;
    departureDate: string;
    returnDate?: string;
    tripType: 'one-way' | 'round-trip';
    passengers: PassengerCounts;
  }) => void;
  isLoading?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, isLoading }) => {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');

  // From
  const [fromId, setFromId] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromStation, setFromStation] = useState<Station | undefined>();

  // To
  const [toId, setToId] = useState('');
  const [toName, setToName] = useState('');
  const [toStation, setToStation] = useState<Station | undefined>();

  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState<PassengerCounts>({ adults: 1, children: 0, infants: 0 });

  // Swap origin ↔ destination
  const handleSwap = () => {
    setFromId(toId); setFromName(toName); setFromStation(toStation);
    setToId(fromId); setToName(fromName); setToStation(fromStation);
  };

  const canSearch = (fromId || fromName.trim()) && (toId || toName.trim());
  const returnDateError = tripType === 'round-trip' && returnDate && returnDate <= departureDate;

  const handleSubmit = () => {
    if (!canSearch) return;
    if (tripType === 'round-trip' && returnDate && returnDate <= departureDate) return;
    onSearch({
      from: fromId || fromName.trim(),
      fromStation,
      to: toId || toName.trim(),
      toStation,
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      tripType,
      passengers
    });
  };

  return (
    <section className="glass-card p-6 mb-4 relative z-30">
      {/* Type tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(['one-way', 'round-trip'] as const).map(type => (
          <button
            key={type}
            onClick={() => setTripType(type)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tripType === type
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {type === 'one-way' ? '✈ Solo Ida' : '↔ Ida y Vuelta'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_40px_1fr_200px_auto_auto] gap-3 items-end">
        {/* Origin */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">
            🚉 Origen
          </label>
          <StationSearch
            placeholder="¿Desde dónde?"
            value={fromId}
            onChange={(id, name) => { setFromId(id); setFromName(name); }}
            onSelect={(s) => { setFromStation(s); setFromId(s.id); setFromName(s.name); }}
          />
        </div>

        {/* Swap button */}
        <div className="flex items-end pb-[1px]">
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-gray-500 flex-shrink-0 hover:text-indigo-400 hover:border-indigo-500/30 transition-all border border-white/5"
            title="Intercambiar origen y destino"
          >
            <ArrowRightLeft size={14} />
          </button>
        </div>

        {/* Destination */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">
            🏁 Destino
          </label>
          <StationSearch
            placeholder="¿A dónde vas?"
            value={toId}
            onChange={(id, name) => { setToId(id); setToName(name); }}
            onSelect={(s) => { setToStation(s); setToId(s.id); setToName(s.name); }}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Salida</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500/50" size={13} />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="glass-input pl-8 text-xs"
              />
            </div>
          </div>
          <div className={`space-y-1.5 transition-opacity ${tripType === 'one-way' ? 'opacity-30 pointer-events-none' : ''}`}>
            <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Regreso</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500/50" size={13} />
              <input
                type="date"
                value={returnDate}
                min={departureDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={tripType === 'one-way'}
                className={`glass-input pl-8 text-xs ${returnDateError ? 'border-red-500/50' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Passengers */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
            <Users size={10} /> Pasajeros
          </label>
          <PassengerSelector value={passengers} onChange={setPassengers} />
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <motion.button
            onClick={handleSubmit}
            disabled={isLoading || !canSearch}
            whileHover={canSearch ? { scale: 1.02 } : {}}
            whileTap={canSearch ? { scale: 0.98 } : {}}
            className="btn-primary w-full h-[42px] text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:!transform-none"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Search size={15} />
                <span className="font-black">Buscar</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </section>
  );
};
