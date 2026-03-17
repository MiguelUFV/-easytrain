import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme';

export const ThemeToggle = () => {
    const { theme, toggle } = useTheme();

    return (
        <button
            onClick={toggle}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center gap-2"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            {theme === 'dark' ? (
                <Sun size={16} className="text-amber-400" />
            ) : (
                <Moon size={16} className="text-indigo-400" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </span>
        </button>
    );
};
