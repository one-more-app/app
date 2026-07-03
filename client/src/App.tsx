import { BottomNav } from '@/components/BottomNav'
import { LeaguePromotionCelebrationHost } from '@/components/LeaguePromotionCelebration'
import { ProfileUsernameSetupHost } from '@/components/profile/ProfileUsernameSetupHost'
import { RestTimeFinishedToastHost } from '@/components/RestTimeFinishedToastHost'
import { Toaster } from '@/components/ui/sonner'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { PageSection } from '@/components/analytics/PageSection'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { useKeyboardInset } from '@/hooks/use-keyboard-inset'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useRestTimerLocalNotifications } from '@/hooks/use-rest-timer-local-notifications'
import { RealtimeProvider } from '@/hooks/use-realtime'
import { useTheme } from '@/hooks/use-theme'
import {
    extractInviteCodeFromUrl,
    persistAndNavigateToInvite,
    setupAppsFlyer,
} from '@/lib/appsflyer'
import { needsOnboarding } from '@/lib/storage'
import { scheduleSafeAreaCssSync } from '@/lib/sync-safe-area-css'
import { routeUsesBackHeader } from '@/lib/back-header-routes'
import { getSystemBarsStyle, IMMERSIVE_FULL_BLEED_ROUTES } from '@/lib/system-bars-style'
import { cn } from '@/lib/utils'
import { AuthPage } from '@/pages/AuthPage'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import ChatPage from '@/pages/ChatPage'
import FriendProfilePage from '@/pages/FriendProfilePage'
import FriendSearchPage from '@/pages/FriendSearchPage'
import FriendsPage from '@/pages/FriendsPage'
import UserPreviewPage from '@/pages/UserPreviewPage'
import { HistoryPage } from '@/pages/HistoryPage'
import HomePage from '@/pages/HomePage'
import InviteLandingPage from '@/pages/InviteLandingPage'
import OnboardingPage from '@/pages/OnboardingPage'
import ProfilePage from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { ReferralDrawerHost } from '@/components/referral/ReferralDrawerHost'
import { ReferralDrawerProvider } from '@/hooks/use-referral-drawer'
import { usePurchases } from '@/hooks/use-purchases'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'


function StatsRedirect() {
    return <Navigate to="/profile" replace />
}

function PurchasesSyncHost() {
    usePurchases()
    return null
}

function AccessGate({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const auth = useAuth()
    usePushNotifications()
    useRestTimerLocalNotifications()
    const isAuthRoute = location.pathname === '/auth'
    const isOnboardingRoute = location.pathname === '/onboarding'
    const isInviteRoute = location.pathname.startsWith('/invite/')
    const onboardingNeeded = needsOnboarding()

    if (auth.status !== 'authenticated') {
        if (onboardingNeeded) {
            if (isOnboardingRoute || isAuthRoute || isInviteRoute) return <>{children}</>
            return <Navigate to="/onboarding" replace />
        }
        if (isAuthRoute || isInviteRoute) return <>{children}</>
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
        location.pathname === '/profile' ||
        location.pathname === '/stats' ||
        location.pathname === '/history' ||
        location.pathname === '/friends' ||
        location.pathname.startsWith('/friends/preview')

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div
                key={location.pathname}
                className={cn('app-scroll-viewport', show && 'pb-bottom-nav-host')}
            >
                {children}
            </div>
            {show ? <BottomNav /> : null}
        </div>
    )
}

function SafeAreaTopScrim() {
    const { pathname } = useLocation()
    if (IMMERSIVE_FULL_BLEED_ROUTES.has(pathname)) return null
    const usesBackHeader = routeUsesBackHeader(pathname)
    return (
        <div
            className={cn('safe-area-top-scrim', usesBackHeader ? 'bg-card' : 'bg-background')}
            aria-hidden
        />
    )
}

function NativeSystemBarsSync() {
    const { resolvedTheme } = useTheme()
    const { pathname } = useLocation()

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        void (async () => {
            const barStyle = getSystemBarsStyle(pathname, resolvedTheme)

            try {
                await StatusBar.setOverlaysWebView({ overlay: true })
            } catch {
                /* Android 15+ : barres gérées par SystemBars natif. */
            }

            try {
                await SystemBars.setStyle({ style: barStyle })
            } catch {
                await StatusBar.setStyle({
                    style: barStyle === SystemBarsStyle.Dark ? Style.Dark : Style.Light,
                })
            }
        })()
    }, [pathname, resolvedTheme])

    return null
}

function App() {
    useKeyboardInset()

    useEffect(() => {
        if (typeof document === 'undefined') return
        document.documentElement.dataset.platform = Capacitor.isNativePlatform()
            ? 'native'
            : 'web'
    }, [])

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return

        scheduleSafeAreaCssSync()

        void setupAppsFlyer()

        const handlerPromise = CapacitorApp.addListener('appUrlOpen', (event) => {
            const inviteCode = extractInviteCodeFromUrl(event.url)
            if (!inviteCode) return
            persistAndNavigateToInvite(inviteCode)
        })

        return () => {
            handlerPromise.then((handle) => handle.remove())
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
            <div className="app-shell">

                <NativeSystemBarsSync />
                <SafeAreaTopScrim />
                <Toaster />
                <LeaguePromotionCelebrationHost />
                <AuthProvider>
                    <RestTimeFinishedToastHost />
                    <ReferralDrawerProvider>
                    <PurchasesSyncHost />
                    <ReferralDrawerHost />
                    <AnalyticsProvider>
                    <RealtimeProvider>
                    <ProfileUsernameSetupHost />
                    <AccessGate>
                        <BottomNavHost>
                            <PageSection>
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <IndexRedirect />
                                    }
                                />
                                <Route path="/onboarding" element={<OnboardingPage />} />
                                <Route path="/home" element={<HomePage />} />
                                <Route path="/stats" element={<StatsRedirect />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/history" element={<HistoryPage />} />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/exercises" element={<ExerciseListPage />} />
                                <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="/invite/:code" element={<InviteLandingPage />} />
                                <Route path="/friends" element={<FriendsPage />} />
                                <Route path="/friends/search" element={<FriendSearchPage />} />
                                <Route path="/friends/chat/:conversationId" element={<ChatPage />} />
                                <Route path="/friends/preview/:userId" element={<UserPreviewPage />} />
                                <Route path="/friends/:userId" element={<FriendProfilePage />} />

                            </Routes>
                            </PageSection>
                        </BottomNavHost>
                    </AccessGate>
                    </RealtimeProvider>
                    </AnalyticsProvider>
                    </ReferralDrawerProvider>
                </AuthProvider>
            </div>
        </HashRouter>
    )
}

export default App
