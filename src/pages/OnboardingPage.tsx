import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { markOnboardingDone, setUserProfile } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function OnboardingPage() {
    const navigate = useNavigate()
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

    return (
        <div className="min-h-screen bg-background">
            <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8">
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

                        <Button onClick={handleSubmit} className="w-full" disabled={!canSubmit}>
                            {UI.continue}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

