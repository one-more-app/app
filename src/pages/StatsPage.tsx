import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackHeader } from '@/components/BackHeader'
import { UI } from '@/lib/translations'
import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StatsPage() {
    return (
        <div className="min-h-screen bg-background">
            <BackHeader title="Stats" />

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

