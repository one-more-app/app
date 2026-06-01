import logoTextLight from "@/assets/logo-text.png";
import { OnboardingVideoShell } from "@/components/OnboardingVideoShell";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { identifyEmail } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/oauth";
import { resolvePostAuthNavigation } from "@/lib/post-auth-navigation";
import { setUserProfile } from "@/lib/storage";
import { UI } from "@/lib/translations";
import { X } from "lucide-react";
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

    const returnToEmailStep = () => {
        auth.clearError();
        setPassword("");
        setStep("email");
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (step === "login") {
            returnToEmailStep();
        }
    };

    const finishSuccess = async () => {
        try {
            const nextPath = await resolvePostAuthNavigation(redirect);
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
            await auth.register({
                email: normalizedEmail,
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            setUserProfile(
                { firstName: firstName.trim(), lastName: lastName.trim() },
                { silent: true },
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
        <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-6 space-y-4">
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
                                        passwordToggle={{
                                            showLabel: UI.showPassword,
                                            hideLabel: UI.hidePassword,
                                        }}
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
                                        passwordToggle={{
                                            showLabel: UI.showPassword,
                                            hideLabel: UI.hidePassword,
                                        }}
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
                        className="w-full shadow-2xl border-border/80 bg-card/95 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-400"
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
                                        onChange={(e) => handleEmailChange(e.target.value)}
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
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium">{UI.email}</label>
                                        <div className="relative">
                                            <Input
                                                value={email}
                                                onChange={(e) => handleEmailChange(e.target.value)}
                                                inputMode="email"
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                placeholder="email@exemple.com"
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-1 my-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                                                aria-label="Changer l'email"
                                                onClick={returnToEmailStep}
                                            >
                                                <X className="size-4 shrink-0" aria-hidden />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Input
                                            label={UI.password}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            type="password"
                                            placeholder="••••••••"
                                            passwordToggle={{
                                                showLabel: UI.showPassword,
                                                hideLabel: UI.hidePassword,
                                            }}
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

                <Card className="w-full shadow-2xl border-border/80 bg-card/95 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500 [animation-delay:120ms]">
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
                                        const session = await signInWithGoogle();
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
                    </CardContent>
                </Card>
        </main>
    );

    if (embedded) {
        return content;
    }

    return <OnboardingVideoShell>{content}</OnboardingVideoShell>;
}

