import { BackHeader } from '@/components/BackHeader'
import { SettingsProfileSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useProfileDataRefresh, useUserProfileData } from '@/hooks/use-api-data'
import { useTheme } from '@/hooks/use-theme'
import { openStoreListing } from '@/lib/app-review'
import type { ThemePreference } from '@/lib/storage'
import { setUserProfileAndWait } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export function SettingsPage() {
    const auth = useAuth()
    const { theme, setTheme } = useTheme()
    const { data: profile } = useUserProfileData()
    const refreshProfile = useProfileDataRefresh()
    const [weightKg, setWeightKg] = useState<string>('')
    const [heightCm, setHeightCm] = useState<string>('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [profileHydrated, setProfileHydrated] = useState(false)

    useEffect(() => {
        if (!profile) return
        const p = profile
        setWeightKg(String(p.weightKg))
        setHeightCm(String(p.heightCm))
        setGender(p.gender)
        setProfileHydrated(true)
    }, [profile])

    const handleSave = () => {
        const w = parseFloat(weightKg)
        const h = parseFloat(heightCm)
        if (!Number.isNaN(w) && w > 0 && !Number.isNaN(h) && h > 0) {
            void (async () => {
                await setUserProfileAndWait({ weightKg: w, heightCm: h, gender })
                await refreshProfile()
            })()
        }
    }

    const handleDeleteAccount = () => {
        if (!window.confirm(UI.deleteAccountConfirm)) return

        const accountEmail = auth.user?.email ?? auth.user?.id ?? '—'
        const subject = encodeURIComponent(UI.deleteAccountEmailSubject)
        const body = encodeURIComponent(
            UI.deleteAccountEmailBody.replace('{email}', accountEmail),
        )
        window.location.href = `mailto:admin@one-more.app?subject=${subject}&body=${body}`
    }

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={UI.settings} />

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{UI.accountAndSync}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {UI.accountSyncDescription}
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {auth.status === 'authenticated' ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    {UI.connectedAs}{' '}
                                    <span className="text-foreground font-medium">
                                        {auth.user?.email ?? auth.user?.id}
                                    </span>
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => {
                                        void auth.logout()
                                    }}
                                >
                                    {UI.signOut}
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">{UI.notConnected}</p>
                                <Button asChild className="w-full">
                                    <Link to="/auth">{UI.signIn}</Link>
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{UI.appearance}</CardTitle>
                        <p className="text-sm text-muted-foreground">{UI.themeDescription}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <label className="text-sm font-medium">{UI.theme}</label>
                        <Select
                            value={theme}
                            onValueChange={(v) => setTheme(v as ThemePreference)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system">{UI.themeSystem}</SelectItem>
                                <SelectItem value="light">{UI.themeLight}</SelectItem>
                                <SelectItem value="dark">{UI.themeDark}</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {!profileHydrated ? (
                    <SettingsProfileSkeleton />
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>{UI.profile}</CardTitle>
                            <p className="text-sm text-muted-foreground">{UI.profileLeagueHint}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="settings-weight"
                                    label={UI.bodyWeight}
                                    type="number"
                                    inputMode="decimal"
                                    min={30}
                                    max={300}
                                    step={0.5}
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(e.target.value)}
                                    onBlur={handleSave}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="settings-height"
                                    label={UI.height}
                                    type="number"
                                    inputMode="numeric"
                                    min={100}
                                    max={250}
                                    step={1}
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    onBlur={handleSave}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>{UI.gender}</Label>
                                <Select
                                    value={gender}
                                    onValueChange={(v) => {
                                        const nextGender = v as 'male' | 'female'
                                        setGender(nextGender)
                                        void (async () => {
                                            await setUserProfileAndWait({ gender: nextGender })
                                            await refreshProfile()
                                        })()
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">{UI.male}</SelectItem>
                                        <SelectItem value="female">{UI.female}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => {
                                handleSave()
                                toast.success('Profil sauvegardé')
                            }} className="w-full">
                                {UI.save}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{UI.rateApp}</CardTitle>
                        <p className="text-sm text-muted-foreground">{UI.rateAppDescription}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button
                            onClick={() => {
                                void openStoreListing()
                            }}
                            className="w-full"
                        >
                            {UI.rateNow}
                        </Button>
                    </CardContent>
                </Card>

                {auth.status === 'authenticated' && (
                    <div className="pt-6 pb-10 text-center">
                        <button
                            type="button"
                            className="text-xs text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline"
                            onClick={handleDeleteAccount}
                        >
                            {UI.deleteAccountLink}
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
