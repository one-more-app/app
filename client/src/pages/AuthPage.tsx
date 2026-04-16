import logoTextLight from "@/assets/logo-text.png";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { identifyEmail } from "@/lib/auth";
import { fetchTrackedExercises } from "@/lib/data-api";
import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import { signInWithOAuth } from "@/lib/oauth";
import {
    setOnboardingFirstExercisePending,
    setOnboardingSyncPending,
    setUserProfile,
    syncLocalDataToRemote,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type AuthStep =
    | "email"
    | "login"
    | "register_firstName"
    | "register_lastName"
    | "register_password";

type AuthPageProps = {
    embedded?: boolean;
};

export function AuthPage({ embedded = false }: AuthPageProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const auth = useAuth();
    const rawRedirect = searchParams.get("redirect");
    const redirect = useMemo(() => {
        if (!rawRedirect) return "/home";
        try {
            return decodeURIComponent(rawRedirect);
        } catch {
            return rawRedirect;
        }
    }, [rawRedirect]);
    const startMode = searchParams.get("mode") === "register" ? "register" : "login";
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<AuthStep>("email");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const shouldSyncOnSuccess = searchParams.get("sync") === "onboarding";

    const normalizedEmail = email.trim().toLowerCase();
    const canContinueEmail = normalizedEmail.includes("@") && !isBusy;
    const canLogin = normalizedEmail.includes("@") && password.length >= 8 && !isBusy;
    const canRegisterFirstName = normalizedEmail.includes("@") && firstName.trim().length >= 1 && !isBusy;
    const canRegisterLastName = normalizedEmail.includes("@") && lastName.trim().length >= 1 && !isBusy;
    const canRegisterPassword =
        normalizedEmail.includes("@") &&
        password.length >= 8 &&
        passwordConfirm === password &&
        !isBusy;

    const finishSuccess = async () => {
        try {
            if (shouldSyncOnSuccess) {
                await syncLocalDataToRemote();
                setOnboardingSyncPending(false);
            }

            let nextPath = redirect;
            if (redirect === "/home") {
                try {
                    const tracked = await fetchTrackedExercises();
                    const hasVisibleTrackedExercise = tracked.some(
                        (exercise) =>
                            (exercise.bodyPart ?? exercise.target) !== "cardio" &&
                            !(exercise.equipment && CARDIO_EQUIPMENT.has(exercise.equipment)),
                    );
                    if (!hasVisibleTrackedExercise) {
                        setOnboardingFirstExercisePending(true);
                        nextPath = "/exercises?tour=onboarding-first";
                    } else {
                        setOnboardingFirstExercisePending(false);
                    }
                } catch {
                    // En cas d'erreur réseau, on garde une navigation standard.
                }
            }

            navigate(nextPath, { replace: true });
        } catch (e) {
            auth.setError(
                e instanceof Error ? e.message : "Impossible de créer la session",
            );
            throw e;
        }
    };

    const submitEmail = async () => {
        if (!canContinueEmail) return;
        setIsBusy(true);
        auth.clearError();
        try {
            const result = await identifyEmail({ email: normalizedEmail });

            if (result.exists) {
                setStep("login");
            } else {
                setStep(startMode === "login" ? "register_firstName" : "register_firstName");
            }
        } finally {
            setIsBusy(false);
        }
    };

    const submitLogin = async () => {
        if (!canLogin) return;
        setIsBusy(true);
        auth.clearError();
        try {
            await auth.login({ email: normalizedEmail, password });
            await finishSuccess();
        } finally {
            setIsBusy(false);
        }
    };

    const submitRegisterPassword = async () => {
        if (!canRegisterPassword) return;
        setIsBusy(true);
        auth.clearError();
        try {
            await auth.register({ email: normalizedEmail, password });
            // On persiste prénom/nom dans le profil (si utilisé).
            setUserProfile(
                { firstName: firstName.trim(), lastName: lastName.trim() },
                { silent: false },
            );
            await finishSuccess();
        } finally {
            setIsBusy(false);
        }
    };

    const registerTotal = 3;
    const registerStepLabel = (current: number) =>
        UI.onboardingStepIndicator
            .replace("{current}", String(current))
            .replace("{total}", String(registerTotal));
    const registerProgress = (current: number) => (current / registerTotal) * 100;

    const content = (
        <main className="relative z-10 mx-auto max-w-2xl px-4 py-6 space-y-4">
                <div className="flex justify-center pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-500">
                    <img
                        src={logoTextLight}
                        alt="One More"
                        className="h-18 w-auto select-none object-contain"
                        loading="eager"
                        decoding="async"
                    />
                </div>
                {step === "register_firstName" ||
                    step === "register_lastName" ||
                    step === "register_password" ? (
                    <StepCard
                        key={`register-${step}`}
                        animated
                        className="shadow-2xl border-border/80 bg-card/95 backdrop-blur-sm"
                        onBack={() => {
                            auth.clearError();
                            if (step === "register_password") {
                                setPassword("");
                                setPasswordConfirm("");
                                setStep("register_lastName");
                                return;
                            }
                            if (step === "register_lastName") {
                                setStep("register_firstName");
                                return;
                            }
                            setStep("email");
                        }}
                        backLabel={UI.back}
                        stepLabel={
                            step === "register_firstName"
                                ? registerStepLabel(1)
                                : step === "register_lastName"
                                    ? registerStepLabel(2)
                                    : registerStepLabel(3)
                        }
                        progressPercent={
                            step === "register_firstName"
                                ? registerProgress(1)
                                : step === "register_lastName"
                                    ? registerProgress(2)
                                    : registerProgress(3)
                        }
                        title={step === "register_firstName" ? UI.firstNameTitle : step === "register_lastName" ? UI.lastNameTitle : UI.passwordTitle}
                        contentClassName="space-y-3"
                    >
                        {step === "register_firstName" ? (
                            <>
                                <Input
                                    label={UI.firstName}
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Prénom"
                                />

                                {auth.lastError && (
                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {auth.lastError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            if (!canRegisterFirstName) return;
                                            auth.clearError();
                                            setStep("register_lastName");
                                        }}
                                        disabled={!canRegisterFirstName}
                                    >
                                        {UI.continue}
                                    </Button>
                                </div>
                            </>
                        ) : step === "register_lastName" ? (
                            <>
                                <Input
                                    label={UI.lastName}
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Nom"
                                />

                                {auth.lastError && (
                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {auth.lastError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            if (!canRegisterLastName) return;
                                            auth.clearError();
                                            setStep("register_password");
                                        }}
                                        disabled={!canRegisterLastName}
                                    >
                                        {UI.continue}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <Input
                                        label={UI.password}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {UI.passwordHint}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Input
                                        label={UI.confirmPassword}
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        type="password"
                                        placeholder="••••••••"
                                    />
                                    {passwordConfirm.length > 0 && passwordConfirm !== password && (
                                        <p className="text-xs text-destructive">{UI.passwordsDoNotMatch}</p>
                                    )}
                                </div>

                                {auth.lastError && (
                                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {auth.lastError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => void submitRegisterPassword()}
                                        disabled={!canRegisterPassword}
                                    >
                                        {UI.createAccount}
                                    </Button>
                                </div>
                            </>
                        )}
                    </StepCard>
                ) : (
                    <Card
                        key={`auth-${step}`}
                        className="shadow-2xl border-border/80 bg-card/95 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-400"
                    >
                        <CardHeader>
                            <CardTitle>{UI.connectOrCreateAccount}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {step === "email" ? (
                                <>
                                    <Input
                                        label={UI.email}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        inputMode="email"
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        placeholder="email@exemple.com"
                                    />

                                    {auth.lastError && (
                                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                            {auth.lastError}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        onClick={() => void submitEmail()}
                                        disabled={!canContinueEmail}
                                    >
                                        {UI.continue}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Input label={UI.email} value={email} disabled />
                                    <div className="space-y-1">
                                        <Input
                                            label={UI.password}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            type="password"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {UI.passwordHint}
                                        </p>
                                    </div>

                                    {auth.lastError && (
                                        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                            {auth.lastError}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Button
                                            className="w-full"
                                            onClick={() => void submitLogin()}
                                            disabled={!canLogin}
                                        >
                                            {UI.login}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="flex items-center gap-3 animate-in fade-in-0 duration-500 [animation-delay:80ms]">
                    <div className="h-px flex-1 bg-border/60" />
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        ou
                    </p>
                    <div className="h-px flex-1 bg-border/60" />
                </div>

                <Card className="shadow-2xl border-border/80 bg-card/95 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:120ms]">
                    <CardHeader>
                        <CardTitle>{UI.continueWith}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full"
                            variant="secondary"
                            disabled={isBusy}
                            onClick={() => {
                                void (async () => {
                                    setIsBusy(true);
                                    auth.clearError();
                                    try {
                                        const session = await signInWithOAuth("google");
                                        auth.acceptSession(session);
                                        await finishSuccess();
                                    } catch (e) {
                                        auth.setError(
                                            e instanceof Error ? e.message : "Connexion Google impossible",
                                        );
                                    } finally {
                                        setIsBusy(false);
                                    }
                                })();
                            }}
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                <svg
                                    aria-hidden
                                    viewBox="0 0 48 48"
                                    className="size-5"
                                >
                                    <path
                                        fill="#EA4335"
                                        d="M24 9.5c3.13 0 5.95 1.08 8.16 2.85l6.1-6.1C34.55 2.79 29.6.5 24 .5 14.62.5 6.54 5.88 2.66 13.7l7.38 5.73C11.94 13.6 17.53 9.5 24 9.5z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M46.5 24.5c0-1.6-.14-2.74-.45-3.93H24v7.44h12.91c-.26 2.06-1.67 5.17-4.8 7.25l7.24 5.61C43.55 35.11 46.5 30.31 46.5 24.5z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M10.04 28.57A14.8 14.8 0 0 1 9.27 24c0-1.59.28-3.12.77-4.57l-7.38-5.73A23.45 23.45 0 0 0 .5 24c0 3.79.9 7.37 2.16 10.3l7.38-5.73z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M24 47.5c5.6 0 10.3-1.85 13.73-5.04l-7.24-5.61c-1.94 1.35-4.55 2.3-6.49 2.3-6.47 0-12.06-4.1-13.96-9.93l-7.38 5.73C6.54 42.12 14.62 47.5 24 47.5z"
                                    />
                                </svg>
                                <span>{UI.continueWithGoogle}</span>
                            </span>
                        </Button>
                        <Button
                            className="w-full"
                            variant="secondary"
                            disabled={isBusy}
                            onClick={() => {
                                void (async () => {
                                    setIsBusy(true);
                                    auth.clearError();
                                    try {
                                        const session = await signInWithOAuth("apple");
                                        auth.acceptSession(session);
                                        await finishSuccess();
                                    } catch (e) {
                                        auth.setError(
                                            e instanceof Error ? e.message : "Connexion Apple impossible",
                                        );
                                    } finally {
                                        setIsBusy(false);
                                    }
                                })();
                            }}
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                <svg
                                    aria-hidden
                                    viewBox="0 0 24 24"
                                    className="size-5 fill-current"
                                >
                                    <path d="M16.365 1.43c0 1.14-.43 2.26-1.19 3.08-.83.9-2.2 1.6-3.4 1.5-.15-1.13.4-2.3 1.17-3.1.85-.9 2.3-1.57 3.42-1.48z" />
                                    <path d="M20.55 17.07c-.46 1.05-.67 1.52-1.26 2.44-.82 1.27-1.98 2.85-3.42 2.86-1.28.01-1.61-.83-3.36-.82-1.75.01-2.12.84-3.4.83-1.44-.01-2.53-1.43-3.35-2.69-2.34-3.6-2.58-7.83-1.14-10.03.96-1.47 2.48-2.33 3.92-2.33 1.47 0 2.39.83 3.6.83 1.17 0 1.88-.84 3.58-.84 1.28 0 2.63.7 3.58 1.91-3.15 1.73-2.64 6.26.65 7.84z" />
                                </svg>
                                <span>{UI.continueWithApple}</span>
                            </span>
                        </Button>
                    </CardContent>
                </Card>
        </main>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
            <video
                className="absolute inset-0 h-full w-full object-cover pointer-events-none bg-black"
                src="/onboarding-bg.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
            />
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div className="pointer-events-none absolute -top-20 -left-20 size-64 rounded-full bg-accent/20 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute bottom-8 -right-20 size-72 rounded-full bg-primary/20 blur-3xl animate-pulse [animation-delay:700ms]" />
            {content}
        </div>
    );
}

