import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
    activeTheme: string;
    setActiveTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTheme, setActiveTheme] = useState('theme-midnight');

    useEffect(() => {
        // Initial load
        window.go.main.App.GetSetting('ActiveTheme').then(theme => {
            if (theme) setActiveTheme(theme);
        });

        // Listen for live preview events (from SettingAppearance)
        const handlePreview = (e: any) => {
            if (e.detail?.themeId) setActiveTheme(e.detail.themeId);
        };
        window.addEventListener('theme-preview', handlePreview);

        return () => window.removeEventListener('theme-preview', handlePreview);
    }, []);

    return (
        <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
            <div className={activeTheme} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
