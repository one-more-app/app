import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SWRConfig } from 'swr'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/hooks/use-theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </SWRConfig>
  </StrictMode>,
)
