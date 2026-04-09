import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/storage'

type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
    theme: ThemePreference
    resolvedTheme: ResolvedTheme
    setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemePreference>(() => getThemePreference())
    const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

    useEffect(() => {
        if (typeof window === 'undefined') return
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light')

        onChange()
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [])

    const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', resolvedTheme === 'dark')
        root.style.colorScheme = resolvedTheme
    }, [resolvedTheme])

    const setTheme = (next: ThemePreference) => {
        setThemeState(next)
        setThemePreference(next)
    }

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme }),
        [theme, resolvedTheme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
