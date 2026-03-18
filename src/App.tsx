import { ExerciseCatalogDetailPage } from '@/pages/ExerciseCatalogDetailPage'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import HomePage from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/sonner'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { needsOnboarding } from '@/lib/storage'
import { AuthProvider } from '@/hooks/use-auth'

function OnboardingGate({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    if (needsOnboarding() && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />
    }
    return <>{children}</>
}

function App() {
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Dark })
            StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => { })
        }
    }, [])

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
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/onboarding" element={<OnboardingPage />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/exercises/:id" element={<ExerciseCatalogDetailPage />} />
                        <Route path="/exercises" element={<ExerciseListPage />} />
                        <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </OnboardingGate>
            </AuthProvider>
        </HashRouter>
    )
}

export default App
