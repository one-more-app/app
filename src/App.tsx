import { ExerciseCatalogDetailPage } from '@/pages/ExerciseCatalogDetailPage'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import HomePage from '@/pages/HomePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

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
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/exercises/:id" element={<ExerciseCatalogDetailPage />} />
                <Route path="/exercises" element={<ExerciseListPage />} />
                <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </HashRouter>
    )
}

export default App
