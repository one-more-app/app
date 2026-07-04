import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export type BuildInfo = {
    version: string
    build: string
    env: string
    mode: string
    apiUrl: string
    platform: string
}

function getApiUrl(): string {
    const runtime =
        typeof window !== 'undefined' && typeof window.__ONE_MORE_API_URL__ === 'string'
            ? window.__ONE_MORE_API_URL__
            : ''
    if (runtime.trim()) {
        return runtime.trim().replace(/\/+$/, '')
    }
    const raw = import.meta.env.VITE_API_URL
    if (typeof raw === 'string' && raw.trim()) return raw.trim().replace(/\/+$/, '')
    return 'http://localhost:3000'
}

function inferBuildEnv(apiUrl: string): string {
    const url = apiUrl.toLowerCase()
    if (url.includes('localhost') || url.includes('127.0.0.1')) return 'dev'
    if (url.includes('staging')) return 'preprod'
    if (url.includes('api.one-more.app')) return 'prod'
    return import.meta.env.MODE
}

export function getStaticBuildInfo(): BuildInfo {
    const apiUrl = getApiUrl()
    const viteVersion = String(import.meta.env.VITE_APP_VERSION ?? '').trim()

    return {
        version: viteVersion || '–',
        build: '–',
        env: inferBuildEnv(apiUrl),
        mode: import.meta.env.MODE,
        apiUrl,
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
    }
}

export async function loadNativeBuildInfo(): Promise<Pick<BuildInfo, 'version' | 'build'>> {
    if (!Capacitor.isNativePlatform()) {
        return { version: getStaticBuildInfo().version, build: '–' }
    }

    try {
        const info = await App.getInfo()
        return {
            version: info.version || '–',
            build: info.build || '–',
        }
    } catch {
        return { version: getStaticBuildInfo().version, build: '–' }
    }
}
