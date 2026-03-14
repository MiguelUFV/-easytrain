import { Users } from 'lucide-react';

interface Props {
    occupancy: number; // 0 to 1
}

export const OccupancyIndicator = ({ occupancy }: Props) => {
    const getStatus = () => {
        if (occupancy < 0.3) return { label: 'Baja', color: '#10b981' };
        if (occupancy < 0.7) return { label: 'Media', color: '#f59e0b' };
        return { label: 'Alta', color: '#ef4444' };
    };

    const { label, color } = getStatus();

    return (
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color }}>
            <Users size={16} />
            <span>Ocupación {label}</span>
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${occupancy * 100}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
};
