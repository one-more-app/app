import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import HomePage from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage'
import OnboardingPage from '@/pages/OnboardingPage'
import { HistoryPage } from '@/pages/HistoryPage'
import StatsPage from '@/pages/StatsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { LeaguePromotionCelebrationHost } from '@/components/LeaguePromotionCelebration'
import { Toaster } from '@/components/ui/sonner'
import { BottomNav } from '@/components/BottomNav'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { initGoogleNativeSignIn } from '@/lib/google-native'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { needsOnboarding } from '@/lib/storage'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'

function AccessGate({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const auth = useAuth()
    const isAuthRoute = location.pathname === '/auth'
    const isOnboardingRoute = location.pathname === '/onboarding'
    const onboardingNeeded = needsOnboarding()

    if (auth.status !== 'authenticated') {
        if (onboardingNeeded) {
            // Pendant l'onboarding, l'écran d'auth doit rester accessible
            // pour finaliser la connexion/inscription avant de marquer onboarding done.
            if (isOnboardingRoute || isAuthRoute) return <>{children}</>
            return <Navigate to="/onboarding" replace />
        }
        // Onboarding déjà fait => compte obligatoire: seules les routes d'auth sont accessibles.
        if (isAuthRoute) return <>{children}</>
        const redirect = encodeURIComponent(
            `${location.pathname}${location.search}${location.hash}`,
        )
        return <Navigate to={`/auth?redirect=${redirect}`} replace />
    }

    if (auth.status === 'authenticated' && isAuthRoute) {
        if (onboardingNeeded) return <Navigate to="/onboarding?step=body&bodyQ=0" replace />
        return <Navigate to="/home" replace />
    }

    if (
        auth.status === 'authenticated' &&
        onboardingNeeded &&
        location.pathname !== '/onboarding' &&
        !isAuthRoute
    ) {
        return <Navigate to="/onboarding?step=body&bodyQ=0" replace />
    }
    return <>{children}</>
}

function IndexRedirect() {
    const auth = useAuth()
    if (needsOnboarding()) return <Navigate to="/onboarding" replace />
    if (auth.status !== 'authenticated') return <Navigate to="/auth" replace />
    return <Navigate to="/home" replace />
}

function BottomNavHost({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const show =
        location.pathname === '/home' ||
        location.pathname === '/stats' ||
        location.pathname === '/history' ||
        location.pathname === '/settings'

    return (
        <div className={show ? 'pb-bottom-nav-host' : undefined}>
            {children}
            {show ? <BottomNav /> : null}
        </div>
    )
}

function App() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return
        void initGoogleNativeSignIn().catch(() => {
            /* Config Google manquante ou plugin indisponible — login au tap. */
        })
    }, [])

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        void (async () => {
            try {
                await StatusBar.setOverlaysWebView({ overlay: true })
            } catch {
                /* Non supporté sur certaines versions (ex. Android 15+ selon le plugin). */
            }
            await StatusBar.setStyle({
                style: resolvedTheme === 'dark' ? Style.Dark : Style.Light,
            })
        })()
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
            <LeaguePromotionCelebrationHost />
            <AuthProvider>
                <AccessGate>
                    <BottomNavHost>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <IndexRedirect />
                                }
                            />
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
                </AccessGate>
            </AuthProvider>
        </HashRouter>
    )
}

export default App
