import React, { useEffect } from 'react';
import { useData } from '../context/DataContext';

const THEMES = {
    energetic: {
        '--theme-primary': '#FF4713',
        '--theme-primary-hover': '#E63C0C',
        '--theme-primary-soft': '#FFEAE0',
        '--theme-volt': '#C8FF3D',
        '--theme-volt-soft': '#F3FFDA',
        '--theme-signal': '#17C974',
        '--theme-signal-soft': '#E4FBEF',
        '--theme-danger': '#FF3B5C',
        '--theme-danger-soft': '#FFE7EA',
        '--theme-ink': '#14161F',
        '--theme-background': '#F1F3F0',
        '--theme-surface': '#ffffff',
        '--theme-font-display': '"Anton", sans-serif',
        '--theme-font-inter': '"Inter", sans-serif',
    },
    ocean: {
        '--theme-primary': '#0EA5E9',
        '--theme-primary-hover': '#0284C7',
        '--theme-primary-soft': '#E0F2FE',
        '--theme-volt': '#38BDF8',
        '--theme-volt-soft': '#F0F9FF',
        '--theme-signal': '#10B981',
        '--theme-signal-soft': '#D1FAE5',
        '--theme-danger': '#EF4444',
        '--theme-danger-soft': '#FEE2E2',
        '--theme-ink': '#0F172A',
        '--theme-background': '#F8FAFC',
        '--theme-surface': '#ffffff',
        '--theme-font-display': '"Oswald", sans-serif',
        '--theme-font-inter': '"Roboto", sans-serif',
    },
    sunset: {
        '--theme-primary': '#E11D48',
        '--theme-primary-hover': '#BE123C',
        '--theme-primary-soft': '#FFE4E6',
        '--theme-volt': '#F59E0B',
        '--theme-volt-soft': '#FEF3C7',
        '--theme-signal': '#059669',
        '--theme-signal-soft': '#D1FAE5',
        '--theme-danger': '#DC2626',
        '--theme-danger-soft': '#FEE2E2',
        '--theme-ink': '#4C0519',
        '--theme-background': '#FFF1F2',
        '--theme-surface': '#ffffff',
        '--theme-font-display': '"Righteous", sans-serif',
        '--theme-font-inter': '"Poppins", sans-serif',
    }
};

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { settings } = useData();
    const preset = settings.uiTheme?.preset || 'energetic';

    useEffect(() => {
        const themeVars = THEMES[preset as keyof typeof THEMES] || THEMES.energetic;
        const root = document.documentElement;
        
        Object.entries(themeVars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        
    }, [preset]);

    return <>{children}</>;
};
