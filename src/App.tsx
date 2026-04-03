import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import HomePage from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import StatsPage from '@/pages/StatsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/BottomNav'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { needsOnboarding } from '@/lib/storage'
import { AuthProvider } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'

function OnboardingGate({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    if (
        needsOnboarding() &&
        location.pathname !== '/onboarding' &&
        location.pathname !== '/auth'
    ) {
        return <Navigate to="/onboarding" replace />
    }
    return <>{children}</>
}

function BottomNavHost({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const show =
        location.pathname === '/home' ||
        location.pathname === '/stats' ||
        location.pathname === '/history' ||
        location.pathname === '/settings'

    return (
        <div className={show ? 'pb-20' : undefined}>
            {children}
            {show ? <BottomNav /> : null}
        </div>
    )
}

function App() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: resolvedTheme === 'dark' ? Style.Light : Style.Dark })
            StatusBar.setBackgroundColor({ color: resolvedTheme === 'dark' ? '#000000' : '#ffffff' }).catch(() => { })
        }
    }, [resolvedTheme])

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return
        const handlerPromise = CapacitorApp.addListener(
            'backButton',
            ({ canGoBack }: { canGoBack: boolean }) => {
                if (canGoBack) {
                    window.history.back()
                } else {
                    CapacitorApp.exitApp()
                }
            }
        )
        return () => {
            handlerPromise.then((handle) => handle.remove())
        }
    }, [])

    return (
        <HashRouter>
            <Toaster />
            <AuthProvider>
                <OnboardingGate>
                    <BottomNavHost>
                        <Routes>
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/onboarding" element={<OnboardingPage />} />
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/stats" element={<StatsPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/exercises" element={<ExerciseListPage />} />
                            <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                        </Routes>
                    </BottomNavHost>
                </OnboardingGate>
            </AuthProvider>
        </HashRouter>
    )
}

export default App
