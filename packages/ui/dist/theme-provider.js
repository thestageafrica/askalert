'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
const ThemeContext = createContext(null);
const STORAGE_KEY = 'askalert-theme';
function getSystemTheme() {
    if (typeof window === 'undefined') {
        return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyThemeClass(resolved) {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
}
export function ThemeProvider({ children, defaultTheme = 'system', }) {
    const [theme, setThemeState] = useState(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState('light');
    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setThemeState(stored);
        }
    }, []);
    useEffect(() => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        setResolvedTheme(resolved);
        applyThemeClass(resolved);
        if (theme !== 'system') {
            return;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            const next = getSystemTheme();
            setResolvedTheme(next);
            applyThemeClass(next);
        };
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [theme]);
    const setTheme = useCallback((next) => {
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    }, []);
    const value = useMemo(() => ({
        theme,
        resolvedTheme,
        setTheme,
    }), [theme, resolvedTheme, setTheme]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=theme-provider.js.map