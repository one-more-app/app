import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { getUserProfile, setUserProfile } from '@/lib/storage'
import { UI } from '@/lib/translations'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export function ProfileLeagueSettingsDialog({
    open,
    onOpenChange,
    onSaved,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved?: () => void
}) {
    const [weightKg, setWeightKg] = useState(() => String(getUserProfile().weightKg))
    const [heightCm, setHeightCm] = useState(() => String(getUserProfile().heightCm))
    const [gender, setGender] = useState<'male' | 'female'>(() => getUserProfile().gender)

    const handleSave = () => {
        const w = parseFloat(weightKg)
        const h = parseFloat(heightCm)
        if (Number.isNaN(w) || w <= 0 || Number.isNaN(h) || h <= 0) {
            toast.error(UI.statsProfileInvalid)
            return
        }
        setUserProfile({ weightKg: w, heightCm: h, gender })
        toast.success(UI.statsProfileSaved)
        onSaved?.()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" showCloseButton>
                <DialogHeader>
                    <DialogTitle>{UI.profile}</DialogTitle>
                    <DialogDescription>{UI.profileLeagueHint}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="stats-profile-weight">{UI.bodyWeight}</Label>
                        <Input
                            id="stats-profile-weight"
                            type="number"
                            inputMode="decimal"
                            min={30}
                            max={300}
                            step={0.5}
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="stats-profile-height">{UI.height}</Label>
                        <Input
                            id="stats-profile-height"
                            type="number"
                            inputMode="numeric"
                            min={100}
                            max={250}
                            step={1}
                            value={heightCm}
                            onChange={(e) => setHeightCm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{UI.gender}</Label>
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
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button type="button" className="w-full" onClick={handleSave}>
                        {UI.save}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                        <Link to="/settings" onClick={() => onOpenChange(false)}>
                            {UI.statsFullSettingsLink}
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
