import {
    OnboardingReveal,
    onboardingStepCardClassName,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import { OnboardingChoiceList } from '@/components/onboarding/OnboardingChoiceList'
import { Trackable } from '@/components/analytics/Trackable'
import { StepCard } from '@/components/StepCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    AnalyticsEvents,
    OnboardingSteps,
    track,
    trackOnboardingStepCompleted,
    trackOnboardingStepSkipped,
    useOnboardingStepViewed,
} from '@/lib/analytics'
import type { DiscoverySourceChoice } from '@/lib/discovery-source'
import { upsertDiscoverySource } from '@/lib/discovery-source-api'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'
import { useMemo, useState } from 'react'

type OnboardingDiscoveryStepProps = {
    onContinue: () => void
    onSkip: () => void
}

export function OnboardingDiscoveryStep({
    onContinue,
    onSkip,
}: OnboardingDiscoveryStepProps) {
    useOnboardingStepViewed(OnboardingSteps.DISCOVERY)
    const [busy, setBusy] = useState(false)
    const [selected, setSelected] = useState<DiscoverySourceChoice | null>(null)
    const [otherDetail, setOtherDetail] = useState('')

    const options = useMemo(() => {
        const platform = Capacitor.getPlatform()
        const storeOption =
            platform === 'android'
                ? {
                      id: 'google_play' as const,
                      label: UI.onboardingDiscoveryPlayStore,
                      analyticsLabel: 'discovery_google_play',
                  }
                : platform === 'ios'
                  ? {
                        id: 'app_store' as const,
                        label: UI.onboardingDiscoveryAppStore,
                        analyticsLabel: 'discovery_app_store',
                    }
                  : {
                        id: 'app_store' as const,
                        label: UI.onboardingDiscoveryAppStores,
                        analyticsLabel: 'discovery_app_store',
                    }

        return [
            storeOption,
            {
                id: 'google_web' as const,
                label: UI.onboardingDiscoveryGoogleWeb,
                analyticsLabel: 'discovery_google_web',
            },
            {
                id: 'friends_family' as const,
                label: UI.onboardingDiscoveryFriendsFamily,
                analyticsLabel: 'discovery_friends_family',
            },
            {
                id: 'tiktok' as const,
                label: UI.onboardingDiscoveryTiktok,
                analyticsLabel: 'discovery_tiktok',
            },
            {
                id: 'instagram' as const,
                label: UI.onboardingDiscoveryInstagram,
                analyticsLabel: 'discovery_instagram',
            },
            {
                id: 'influencer' as const,
                label: UI.onboardingDiscoveryInfluencer,
                analyticsLabel: 'discovery_influencer',
            },
            {
                id: 'chatgpt_ai' as const,
                label: UI.onboardingDiscoveryChatgptAi,
                analyticsLabel: 'discovery_chatgpt_ai',
            },
            {
                id: 'youtube' as const,
                label: UI.onboardingDiscoveryYoutube,
                analyticsLabel: 'discovery_youtube',
            },
            {
                id: 'other' as const,
                label: UI.onboardingDiscoveryOther,
                analyticsLabel: 'discovery_other',
            },
        ]
    }, [])

    const canContinue =
        selected != null &&
        (selected !== 'other' || otherDetail.trim().length > 0)

    const persistAndLeave = async (
        source: DiscoverySourceChoice | 'skipped',
        detail?: string | null,
    ) => {
        if (busy) return
        setBusy(true)
        try {
            await upsertDiscoverySource({
                source,
                detail: source === 'other' ? detail : null,
            })
            if (source === 'skipped') {
                track(AnalyticsEvents.DISCOVERY_SOURCE_SKIPPED)
                trackOnboardingStepSkipped({
                    step: OnboardingSteps.DISCOVERY,
                    reason: 'skipped',
                })
                onSkip()
            } else {
                track(AnalyticsEvents.DISCOVERY_SOURCE_SELECTED, {
                    source,
                    ...(source === 'other' && detail
                        ? { has_detail: true }
                        : {}),
                })
                trackOnboardingStepCompleted({
                    step: OnboardingSteps.DISCOVERY,
                    source,
                })
                onContinue()
            }
        } catch {
            if (source === 'skipped') onSkip()
            else onContinue()
        } finally {
            setBusy(false)
        }
    }

    return (
        <Trackable section="onboarding" feature={OnboardingSteps.DISCOVERY}>
            <OnboardingStepLayout>
                <StepCard
                    className={onboardingStepCardClassName}
                    title={UI.onboardingDiscoveryTitle}
                    headerClassName="space-y-3"
                    contentClassName="space-y-4"
                    onSkip={() => void persistAndLeave('skipped')}
                    skipLabel={UI.onboardingSkip}
                    skipAnalyticsLabel="onboarding_discovery_skip"
                >
                    <OnboardingChoiceList
                        value={selected}
                        options={options}
                        onSelect={setSelected}
                        ariaLabel={UI.onboardingDiscoveryTitle}
                    />
                    {selected === 'other' ? (
                        <OnboardingReveal delayMs={80}>
                            <Input
                                value={otherDetail}
                                onChange={(event) =>
                                    setOtherDetail(event.target.value)
                                }
                                placeholder={
                                    UI.onboardingDiscoveryOtherPlaceholder
                                }
                                maxLength={200}
                                disabled={busy}
                                aria-label={
                                    UI.onboardingDiscoveryOtherPlaceholder
                                }
                            />
                        </OnboardingReveal>
                    ) : null}
                    <div className="mt-auto pt-2">
                        <OnboardingReveal delayMs={200}>
                            <Button
                                variant="accent"
                                className="w-full"
                                data-analytics-label="onboarding_discovery_continue"
                                disabled={busy || !canContinue}
                                onClick={() => {
                                    if (!selected) return
                                    void persistAndLeave(
                                        selected,
                                        otherDetail.trim() || null,
                                    )
                                }}
                            >
                                {UI.onboardingDiscoveryContinue}
                            </Button>
                        </OnboardingReveal>
                    </div>
                </StepCard>
            </OnboardingStepLayout>
        </Trackable>
    )
}
