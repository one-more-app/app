import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { signInWithOAuth } from '@/lib/oauth'
import { markOnboardingDone, setUserProfile } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export function OnboardingPage() {
    const navigate = useNavigate()
    const auth = useAuth()
    const [searchParams] = useSearchParams()
    const step = searchParams.get('step') === 'questions' ? 'questions' : 'intro'
    const [isBusy, setIsBusy] = useState(false)

    const goQuestions = () => {
        navigate('/onboarding?step=questions', { replace: true })
    }

    // --- Questionnaire (poids, taille, genre) ---
    const [weightKg, setWeightKg] = useState<string>('')
    const [heightCm, setHeightCm] = useState<string>('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

    const parsed = useMemo(() => {
        const w = parseFloat(weightKg)
        const h = parseFloat(heightCm)
        return {
            weightOk: Number.isFinite(w) && w > 0,
            heightOk: Number.isFinite(h) && h > 0,
            weight: w,
            height: h,
        }
    }, [weightKg, heightCm])

    const canSubmit = parsed.weightOk && parsed.heightOk

    const handleSubmit = () => {
        setHasTriedSubmit(true)
        if (!canSubmit) return
        setUserProfile({ weightKg: parsed.weight, heightCm: parsed.height, gender })
        markOnboardingDone()
        navigate('/home', { replace: true })
    }

    const handleOAuth = async (provider: 'google' | 'apple') => {
        if (isBusy) return
        setIsBusy(true)
        try {
            auth.clearError()
            const session = await signInWithOAuth(provider)
            auth.acceptSession(session)
            goQuestions()
        } catch (e) {
            auth.setError(e instanceof Error ? e.message : 'Connexion impossible')
        } finally {
            setIsBusy(false)
        }
    }

    return (
        <div className="relative min-h-screen bg-background overflow-hidden">
            <video
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                src="/onboarding-bg.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                poster="/logo.png"
            />

            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            {step === 'intro' ? (
                <div className="relative z-10 flex min-h-screen flex-col">
                    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-10 pb-6 space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold text-foreground">
                                {UI.onboardingTitle}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {UI.onboardingDescription}
                            </p>
                        </div>

                        {auth.lastError && (
                            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {auth.lastError}
                            </div>
                        )}
                    </main>

                    <div className="px-4 pb-4 mt-auto">
                        <div className="mx-auto max-w-2xl space-y-3">
                            <Button asChild className="w-full" disabled={isBusy}>
                                <Link
                                    to={`/auth?mode=register&redirect=${encodeURIComponent(
                                        '/onboarding?step=questions',
                                    )}`}
                                >
                                    {UI.createAccount}
                                </Link>
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                disabled={isBusy}
                                onClick={() => void handleOAuth('google')}
                            >
                                {UI.continueWithGoogle}
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                disabled={isBusy}
                                onClick={() => void handleOAuth('apple')}
                            >
                                {UI.continueWithApple}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                disabled={isBusy}
                                onClick={goQuestions}
                            >
                                {UI.later}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>{UI.onboardingTitle}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {UI.onboardingDescription}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{UI.gender}</label>
                                <Select
                                    value={gender}
                                    onValueChange={(v) => setGender(v as 'male' | 'female')}
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{UI.bodyWeight}</label>
                                <Input
                                    type="number"
                                    inputMode="decimal"
                                    min={30}
                                    max={300}
                                    step={0.5}
                                    value={weightKg}
                                    onChange={(e) => setWeightKg(e.target.value)}
                                    aria-invalid={hasTriedSubmit && !parsed.weightOk}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">{UI.height}</label>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={100}
                                    max={250}
                                    step={1}
                                    value={heightCm}
                                    onChange={(e) => setHeightCm(e.target.value)}
                                    aria-invalid={hasTriedSubmit && !parsed.heightOk}
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                className="w-full"
                                disabled={!canSubmit}
                            >
                                {UI.continue}
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            )}
        </div>
    )
}

