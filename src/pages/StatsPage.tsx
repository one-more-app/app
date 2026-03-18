import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UI } from '@/lib/translations'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function StatsPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        aria-label={UI.back}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="truncate text-lg font-semibold">Stats</h1>
                </div>
            </header>

            <main className="mx-auto max-w-2xl space-y-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="size-5" />
                            Stats (bientot)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Les futures statistiques vont bientot arriver. Pour l'instant,
                            continue a suivre tes performances depuis Exercices.
                        </p>
                        <Button asChild className="w-full">
                            <Link to="/exercises">{UI.chooseExercises}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

