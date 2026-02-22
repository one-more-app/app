import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { ExerciseCatalogDetailPage } from '@/pages/ExerciseCatalogDetailPage'
import { ExerciseListPage } from '@/pages/ExerciseListPage'
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage'
import { ExerciseDayDetailPage } from '@/pages/ExerciseDayDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark })
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {})
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
        <Route path="/exercise/:id/day/:date" element={<ExerciseDayDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App
