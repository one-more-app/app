import {
    AppleBrandIcon,
    ChatGptBrandIcon,
    ClaudeBrandIcon,
    GeminiBrandIcon,
    GoogleBrandIcon,
    GooglePlayBrandIcon,
    InstagramBrandIcon,
    PerplexityBrandIcon,
    TikTokBrandIcon,
    YouTubeBrandIcon,
} from '@/components/onboarding/discovery-brand-icons'
import {
    OnboardingReveal,
    onboardingStepCardClassName,
    OnboardingStepLayout,
} from '@/components/onboarding/onboarding-motion'
import {
    OnboardingChoiceList,
    type OnboardingChoiceOption,
} from '@/components/onboarding/OnboardingChoiceList'
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
import { CircleEllipsis, Megaphone, Store, Users } from 'lucide-react'
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

    const options = useMemo((): OnboardingChoiceOption<DiscoverySourceChoice>[] => {
        const platform = Capacitor.getPlatform()
        const storeOption: OnboardingChoiceOption<DiscoverySourceChoice> =
            platform === 'android'
                ? {
                      id: 'google_play',
                      label: UI.onboardingDiscoveryPlayStore,
                      icon: <GooglePlayBrandIcon />,
                      analyticsLabel: 'discovery_google_play',
                  }
                : platform === 'ios'
                  ? {
                        id: 'app_store',
                        label: UI.onboardingDiscoveryAppStore,
                        icon: <AppleBrandIcon />,
                        analyticsLabel: 'discovery_app_store',
                    }
                  : {
                        id: 'app_store',
                        label: UI.onboardingDiscoveryAppStores,
                        Icon: Store,
                        analyticsLabel: 'discovery_app_store',
                    }

        const social = UI.onboardingDiscoverySectionSocial
        const ai = UI.onboardingDiscoverySectionAi

        return [
            storeOption,
            {
                id: 'google_web',
                label: UI.onboardingDiscoveryGoogleWeb,
                icon: <GoogleBrandIcon />,
                analyticsLabel: 'discovery_google_web',
            },
            {
                id: 'friends_family',
                label: UI.onboardingDiscoveryFriendsFamily,
                Icon: Users,
                analyticsLabel: 'discovery_friends_family',
            },
            {
                id: 'tiktok',
                label: UI.onboardingDiscoveryTiktok,
                icon: <TikTokBrandIcon />,
                section: social,
                analyticsLabel: 'discovery_tiktok',
            },
            {
                id: 'instagram',
                label: UI.onboardingDiscoveryInstagram,
                icon: <InstagramBrandIcon />,
                section: social,
                analyticsLabel: 'discovery_instagram',
            },
            {
                id: 'youtube',
                label: UI.onboardingDiscoveryYoutube,
                icon: <YouTubeBrandIcon />,
                section: social,
                analyticsLabel: 'discovery_youtube',
            },
            {
                id: 'influencer',
                label: UI.onboardingDiscoveryInfluencer,
                Icon: Megaphone,
                section: social,
                analyticsLabel: 'discovery_influencer',
            },
            {
                id: 'chatgpt_ai',
                label: UI.onboardingDiscoveryChatgpt,
                icon: <ChatGptBrandIcon />,
                section: ai,
                analyticsLabel: 'discovery_chatgpt_ai',
            },
            {
                id: 'claude',
                label: UI.onboardingDiscoveryClaude,
                icon: <ClaudeBrandIcon />,
                section: ai,
                analyticsLabel: 'discovery_claude',
            },
            {
                id: 'gemini',
                label: UI.onboardingDiscoveryGemini,
                icon: <GeminiBrandIcon />,
                section: ai,
                analyticsLabel: 'discovery_gemini',
            },
            {
                id: 'perplexity',
                label: UI.onboardingDiscoveryPerplexity,
                icon: <PerplexityBrandIcon />,
                section: ai,
                analyticsLabel: 'discovery_perplexity',
            },
            {
                id: 'other',
                label: UI.onboardingDiscoveryOther,
                Icon: CircleEllipsis,
                analyticsLabel: 'discovery_other',
            },
        ]
    }, [])

    const canSubmitOther = otherDetail.trim().length > 0

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

    const selectSource = (source: DiscoverySourceChoice) => {
        if (busy) return
        setSelected(source)
        if (source === 'other') return
        void persistAndLeave(source)
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
                        onSelect={selectSource}
                        ariaLabel={UI.onboardingDiscoveryTitle}
                    />
                    {selected === 'other' ? (
                        <OnboardingReveal delayMs={80} className="space-y-3">
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
                                autoFocus
                                aria-label={
                                    UI.onboardingDiscoveryOtherPlaceholder
                                }
                                onKeyDown={(event) => {
                                    if (event.key !== 'Enter') return
                                    if (!canSubmitOther) return
                                    void persistAndLeave(
                                        'other',
                                        otherDetail.trim(),
                                    )
                                }}
                            />
                            <Button
                                variant="accent"
                                className="w-full"
                                data-analytics-label="onboarding_discovery_continue"
                                disabled={busy || !canSubmitOther}
                                onClick={() =>
                                    void persistAndLeave(
                                        'other',
                                        otherDetail.trim(),
                                    )
                                }
                            >
                                {UI.onboardingDiscoveryContinue}
                            </Button>
                        </OnboardingReveal>
                    ) : null}
                </StepCard>
            </OnboardingStepLayout>
        </Trackable>
    )
}
