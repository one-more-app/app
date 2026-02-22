import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getUserProfile, setUserProfile } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useBack } from '@/hooks/use-back'

export function SettingsPage() {
    const goBack = useBack()
    const [weightKg, setWeightKg] = useState<string>('')
    const [heightCm, setHeightCm] = useState<string>('')
    const [gender, setGender] = useState<'male' | 'female'>('male')

    useEffect(() => {
        const p = getUserProfile()
        setWeightKg(String(p.weightKg))
        setHeightCm(String(p.heightCm))
        setGender(p.gender)
    }, [])

    const handleSave = () => {
        const w = parseFloat(weightKg)
        const h = parseFloat(heightCm)
        if (!Number.isNaN(w) && w > 0 && !Number.isNaN(h) && h > 0) {
            setUserProfile({ weightKg: w, heightCm: h, gender })
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={goBack}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="truncate text-lg font-semibold">{UI.settings}</h1>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{UI.profile}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Utilisé pour calculer ta ligue (ratio force / poids du corps).
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{UI.bodyWeight}</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                min={30}
                                max={300}
                                step={0.5}
                                value={weightKg}
                                onChange={(e) => setWeightKg(e.target.value)}
                                onBlur={handleSave}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{UI.height}</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={100}
                                max={250}
                                step={1}
                                value={heightCm}
                                onChange={(e) => setHeightCm(e.target.value)}
                                onBlur={handleSave}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-base"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{UI.gender}</label>
                            <Select
                                value={gender}
                                onValueChange={(v) => {
                                    setGender(v as 'male' | 'female')
                                    setUserProfile({ gender: v as 'male' | 'female' })
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
                        <Button onClick={handleSave} className="w-full">
                            {UI.save}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
