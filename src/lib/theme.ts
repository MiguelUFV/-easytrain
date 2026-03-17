import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggle: () => void;
}

export const useTheme = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: 'dark' as Theme,
            setTheme: (theme) => {
                set({ theme });
                applyTheme(theme);
            },
            toggle: () => {
                const next = get().theme === 'dark' ? 'light' : 'dark';
                set({ theme: next });
                applyTheme(next);
            },
        }),
        {
            name: 'easytrain-theme',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) applyTheme(state.theme);
            },
        }
    )
);

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
    } else {
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
    }
}
