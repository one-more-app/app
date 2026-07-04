import { getStaticBuildInfo, loadNativeBuildInfo, type BuildInfo } from '@/lib/build-info'
import { UI } from '@/lib/translations'
import { useEffect, useState } from 'react'

function BuildInfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-wrap items-baseline justify-center gap-x-1.5">
            <dt className="text-muted-foreground/35">{label}</dt>
            <dd className="break-all text-muted-foreground/50">{value}</dd>
        </div>
    )
}

export function SettingsBuildInfo() {
    const [info, setInfo] = useState<BuildInfo>(() => getStaticBuildInfo())

    useEffect(() => {
        let cancelled = false

        void loadNativeBuildInfo().then((native) => {
            if (cancelled) return
            setInfo((current) => ({
                ...current,
                version: native.version,
                build: native.build,
            }))
        })

        return () => {
            cancelled = true
        }
    }, [])

    return (
        <div className="pb-10 pt-2 text-center">
            <dl className="space-y-0.5 font-mono text-[10px] leading-relaxed">
                <BuildInfoLine label={UI.settingsBuildVersion} value={info.version} />
                <BuildInfoLine label={UI.settingsBuildNumber} value={info.build} />
                <BuildInfoLine label={UI.settingsBuildEnv} value={info.env} />
                <BuildInfoLine label={UI.settingsBuildMode} value={info.mode} />
                <BuildInfoLine label={UI.settingsBuildPlatform} value={info.platform} />
                <BuildInfoLine label={UI.settingsBuildApi} value={info.apiUrl} />
            </dl>
        </div>
    )
}
