import { Trackable } from "@/components/analytics/Trackable";
import { onboardingEntrance, onboardingStepCardClassName } from "@/components/onboarding/onboarding-motion";
import { OnboardingFeatureSlider } from "@/components/onboarding/OnboardingFeatureSlider";
import { OnboardingMarcusHero } from "@/components/onboarding/OnboardingMarcusHero";
import { OnboardingShell } from "@/components/OnboardingShell";
import {
    UsernameField,
    type UsernameFieldStatus,
} from "@/components/profile/UsernameField";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
    OnboardingSteps,
    trackAuthFailure,
    trackAuthSuccess,
    trackOnboardingStepCompleted,
    useOnboardingStepViewed,
    type OnboardingStepId,
} from "@/lib/analytics";
import {
  registerHardwareBackHandler,
  resolveAccountOnboardingBackPath,
} from "@/lib/app-back-navigation";
import { identifyEmail, suggestUsername } from "@/lib/auth";
import { signInWithApple, signInWithGoogle } from "@/lib/oauth";
import { isOAuthCancelledByUser, oauthUserMessage } from "@/lib/oauth-errors";
import { postAuthNavigateOptions, resolvePostAuthNavigation } from "@/lib/post-auth-navigation";
import { applyPendingOnboardingProfileAfterAuth, needsOnboarding, peekPendingOnboardingRecord, setUserProfile } from "@/lib/storage";
import { UI } from "@/lib/translations";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { Mail } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const CGU_URL = "https://site.one-more.app/cgu";
const PRIVACY_URL = "https://site.one-more.app/privacy";
type AuthStep =
    | "methods"
    | "email"
    | "login"
    | "register_firstName"
    | "register_lastName"
    | "register_username"
    | "register_password";

function authOnboardingStep(step: AuthStep): OnboardingStepId | null {
    if (step === "methods") return OnboardingSteps.PRE_REGISTRATION;
    if (step === "login") return OnboardingSteps.ACCOUNT_LOGIN;
    if (step === "register_firstName") {
        return OnboardingSteps.ACCOUNT_REGISTER_FIRST_NAME;
    }
    if (step === "register_lastName") {
        return OnboardingSteps.ACCOUNT_REGISTER_LAST_NAME;
    }
    if (step === "register_username") {
        return OnboardingSteps.ACCOUNT_REGISTER_USERNAME;
    }
    if (step === "register_password") {
        return OnboardingSteps.ACCOUNT_REGISTER_PASSWORD;
    }
    return OnboardingSteps.ACCOUNT_EMAIL;
}

type AuthPageProps = {
    embedded?: boolean;
};

const showAppleSignIn =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

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
    const [step, setStep] = useState<AuthStep>("methods");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameStatus, setUsernameStatus] =
        useState<UsernameFieldStatus>("idle");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isBusy, setIsBusy] = useState(false);
    const registerPasswordRef = useRef<HTMLInputElement>(null);
    const registerPasswordConfirmRef = useRef<HTMLInputElement>(null);
    const trackOnboardingAuth = embedded || needsOnboarding();
    const fromOnboardingConversion = embedded && peekPendingOnboardingRecord() != null;
    const currentAuthStep = authOnboardingStep(step);
    useOnboardingStepViewed(
        trackOnboardingAuth &&
            currentAuthStep &&
            currentAuthStep !== OnboardingSteps.PRE_REGISTRATION
            ? currentAuthStep
            : null,
    );
    const normalizedEmail = email.trim().toLowerCase();
    const canContinueEmail = normalizedEmail.includes("@") && !isBusy;
    const canLogin = normalizedEmail.includes("@") && password.length >= 8 && !isBusy;
    const canRegisterFirstName = normalizedEmail.includes("@") && firstName.trim().length >= 1 && !isBusy;
    const canRegisterLastName = normalizedEmail.includes("@") && lastName.trim().length >= 1 && !isBusy;
    const normalizedUsername = normalizeUsername(username);
    const canRegisterUsername =
        normalizedEmail.includes("@") &&
        isValidUsername(normalizedUsername) &&
        usernameStatus === "available" &&
        !isBusy;
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

    const returnToMethodsStep = () => {
        auth.clearError();
        setStep("methods");
    };

    useEffect(() => {
        return registerHardwareBackHandler(() => {
            if (step === "login") {
                returnToEmailStep();
                return true;
            }
            if (step === "email") {
                returnToMethodsStep();
                return true;
            }
            if (step === "methods" && embedded) {
                navigate(resolveAccountOnboardingBackPath(), { replace: true });
                return true;
            }
            return false;
        });
    }, [embedded, navigate, step]);

    const finishSuccess = async (options?: { isNewUser?: boolean }) => {
        try {
            const nextPath = await resolvePostAuthNavigation(redirect, {
                isNewUser: options?.isNewUser === true,
            });
            navigate(nextPath, postAuthNavigateOptions(nextPath));
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
                if (trackOnboardingAuth) {
                    trackOnboardingStepCompleted({
                        step: OnboardingSteps.ACCOUNT_EMAIL,
                        exists: true,
                    });
                }
                setStep("login");
            } else {
                if (trackOnboardingAuth) {
                    trackOnboardingStepCompleted({
                        step: OnboardingSteps.ACCOUNT_EMAIL,
                        exists: false,
                    });
                }
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
            if (trackOnboardingAuth) {
                trackOnboardingStepCompleted({
                    step: OnboardingSteps.ACCOUNT_LOGIN,
                    method: "email",
                });
            }
            await finishSuccess({ isNewUser: false });
        } catch {
            // trackAuthFailure déjà émis dans use-auth.login
        } finally {
            setIsBusy(false);
        }
    };

    const submitRegister = async () => {
        if (!canRegisterPassword || isBusy) return;
        setIsBusy(true);
        auth.clearError();
        try {
            await auth.register({
                email: normalizedEmail,
                password,
                username: normalizedUsername,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            if (trackOnboardingAuth) {
                trackOnboardingStepCompleted({
                    step: OnboardingSteps.ACCOUNT_REGISTER_PASSWORD,
                });
            }
            setUserProfile(
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    username: normalizedUsername,
                },
                { silent: true },
            );
            await finishSuccess({ isNewUser: true });
        } catch {
            // trackAuthFailure déjà émis dans use-auth.register
        } finally {
            setIsBusy(false);
        }
    };

    const goToRegisterLastName = () => {
        if (!canRegisterFirstName) return;
        auth.clearError();
        if (trackOnboardingAuth) {
            trackOnboardingStepCompleted({
                step: OnboardingSteps.ACCOUNT_REGISTER_FIRST_NAME,
            });
        }
        setStep("register_lastName");
    };

    const goToRegisterUsername = () => {
        if (!canRegisterLastName) return;
        auth.clearError();
        void (async () => {
            try {
                const { available } = await suggestUsername({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: normalizedEmail,
                });
                setUsername(available);
                setUsernameStatus("idle");
            } catch {
                setUsername("");
                setUsernameStatus("idle");
            }
            if (trackOnboardingAuth) {
                trackOnboardingStepCompleted({
                    step: OnboardingSteps.ACCOUNT_REGISTER_LAST_NAME,
                });
            }
            setStep("register_username");
        })();
    };

    const goToRegisterPassword = () => {
        if (!canRegisterUsername) return;
        auth.clearError();
        if (trackOnboardingAuth) {
            trackOnboardingStepCompleted({
                step: OnboardingSteps.ACCOUNT_REGISTER_USERNAME,
            });
        }
        setStep("register_password");
    };

    const isRegisterStep =
        step === "register_firstName" ||
        step === "register_lastName" ||
        step === "register_username" ||
        step === "register_password";
    const isFormStep = isRegisterStep || step === "email" || step === "login";

    const content = (
        <Trackable
            section={trackOnboardingAuth ? "onboarding" : "auth"}
            feature={currentAuthStep ?? "pre_registration"}
            className={onboardingEntrance(
                isFormStep
                    ? cn(
                          "relative z-10 mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-4 pb-6",
                          // Shell parent en bleedTop (onboarding account) : on pose le safe-top ici.
                          embedded
                              ? "pt-[calc(var(--safe-top)+0.75rem)]"
                              : "pt-3",
                      )
                    : "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto",
                "animate-in fade-in-0 slide-in-from-left-4 duration-400",
            )}
        >
            {isRegisterStep ? (
                <StepCard
                    key={`register-${step}`}
                    className={`${onboardingStepCardClassName} flex-none`}
                    onBack={() => {
                        auth.clearError();
                        if (step === "register_password") {
                            setPassword("");
                            setPasswordConfirm("");
                            setStep("register_username");
                            return;
                        }
                        if (step === "register_username") {
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
                    backAnalyticsLabel="onboarding_auth_back"
                    title={
                        step === "register_firstName"
                            ? UI.firstNameTitle
                            : step === "register_lastName"
                                ? UI.lastNameTitle
                                : step === "register_username"
                                    ? UI.usernameTitle
                                    : UI.passwordTitle
                    }
                    contentClassName="space-y-3"
                >
                    {step === "register_firstName" ? (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                goToRegisterLastName();
                            }}
                        >
                            <Input
                                label={UI.firstName}
                                value={firstName}
                                className="bg-card"
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Prénom"
                                autoComplete="given-name"
                                autoFocus
                                enterKeyHint="next"
                            />

                            {auth.lastError && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {auth.lastError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    data-analytics-label="onboarding_register_first_name_next"
                                    disabled={!canRegisterFirstName}
                                >
                                    {UI.continue}
                                </Button>
                            </div>
                        </form>
                    ) : step === "register_lastName" ? (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                goToRegisterUsername();
                            }}
                        >
                            <Input
                                label={UI.lastName}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Nom"
                                className="bg-card"
                                autoComplete="family-name"
                                autoFocus
                                enterKeyHint="next"
                            />

                            {auth.lastError && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {auth.lastError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    data-analytics-label="onboarding_register_last_name_next"
                                    disabled={!canRegisterLastName}
                                >
                                    {UI.continue}
                                </Button>
                            </div>
                        </form>
                    ) : step === "register_username" ? (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                goToRegisterPassword();
                            }}
                        >
                            <UsernameField
                                value={username}
                                onChange={setUsername}
                                onStatusChange={setUsernameStatus}
                                inputClassName="bg-card"
                                autoFocus
                                enterKeyHint="next"
                            />

                            {auth.lastError && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {auth.lastError}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    data-analytics-label="onboarding_register_username_next"
                                    disabled={!canRegisterUsername}
                                >
                                    {UI.continue}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void submitRegister();
                            }}
                        >
                            <div className="space-y-1">
                                <Input
                                    ref={registerPasswordRef}
                                    label={UI.password}
                                    value={password}
                                    className="bg-card"
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    autoFocus
                                    enterKeyHint="next"
                                    onKeyDown={(e) => {
                                        // Bouton submit disabled → Entrée ne déclenche pas onSubmit.
                                        if (e.key !== "Enter") return;
                                        e.preventDefault();
                                        if (!passwordConfirm) {
                                            registerPasswordConfirmRef.current?.focus();
                                            return;
                                        }
                                        void submitRegister();
                                    }}
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
                                    ref={registerPasswordConfirmRef}
                                    label={UI.confirmPassword}
                                    value={passwordConfirm}
                                    className="bg-card"
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    enterKeyHint="done"
                                    onKeyDown={(e) => {
                                        if (e.key !== "Enter") return;
                                        e.preventDefault();
                                        if (!password) {
                                            registerPasswordRef.current?.focus();
                                            return;
                                        }
                                        void submitRegister();
                                    }}
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
                                    type="submit"
                                    className="w-full"
                                    data-analytics-label="onboarding_create_account"
                                    disabled={!canRegisterPassword}
                                >
                                    {UI.createAccount}
                                </Button>
                            </div>
                        </form>
                    )}
                </StepCard>
            ) : step === "email" ? (
                <StepCard
                    key="email"
                    className={`${onboardingStepCardClassName} flex-none`}
                    onBack={returnToMethodsStep}
                    backLabel={UI.back}
                    backAnalyticsLabel="onboarding_auth_back"
                    title={UI.emailTitle}
                    contentClassName="space-y-3"
                >
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void submitEmail();
                        }}
                    >
                        <Input
                            label={UI.email}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            inputMode="email"
                            autoCapitalize="none"
                            className="bg-card"
                            autoCorrect="off"
                            autoComplete="email"
                            autoFocus
                            enterKeyHint="next"
                            placeholder="email@exemple.com"
                        />

                        {auth.lastError && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {auth.lastError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Button
                                type="submit"
                                className="w-full"
                                data-analytics-label="onboarding_email_submit"
                                disabled={!canContinueEmail}
                            >
                                {UI.continue}
                            </Button>
                        </div>
                    </form>
                </StepCard>
            ) : step === "login" ? (
                <StepCard
                    key="login"
                    className={`${onboardingStepCardClassName} flex-none`}
                    onBack={returnToEmailStep}
                    backLabel={UI.back}
                    backAnalyticsLabel="onboarding_auth_back"
                    title={UI.authLoginTitle}
                    contentClassName="space-y-3"
                >
                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void submitLogin();
                        }}
                    >
                        <div className="space-y-1">
                            <Input
                                label={UI.password}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="••••••••"
                                className="bg-card"
                                autoComplete="current-password"
                                autoFocus
                                enterKeyHint="done"
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
                                type="submit"
                                className="w-full"
                                data-analytics-label="onboarding_login_submit"
                                disabled={!canLogin}
                            >
                                {UI.login}
                            </Button>
                        </div>
                    </form>
                </StepCard>
            ) : (
                <div className="flex min-h-0 w-full flex-1 flex-col">
                    <div className="relative shrink-0">
                        <OnboardingMarcusHero />
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent"
                        />
                        <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-[calc(var(--safe-top)+1rem)]">
                            <img
                                src="/logo-white-text.png"
                                alt="One More"
                                className={onboardingEntrance(
                                    "h-14 w-auto select-none object-contain sm:h-16 animate-in fade-in-0 slide-in-from-bottom-3 duration-400",
                                )}
                                loading="eager"
                                decoding="async"
                            />
                        </div>
                    </div>

                    <div className="-mt-40 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center px-4 py-6">
                        <OnboardingFeatureSlider
                            analyticsStep={OnboardingSteps.PRE_REGISTRATION}
                        />
                    </div>

                    <footer className="shrink-0 px-4 pb-4 pt-2">
                        <div
                            className={onboardingEntrance(
                                "mx-auto w-full max-w-lg space-y-3 animate-in fade-in-0 slide-in-from-bottom-3 duration-400 [animation-delay:200ms]",
                            )}
                        >
                            {fromOnboardingConversion ? (
                                <p className="text-center text-xs text-muted-foreground">
                                    {UI.onboardingAccountLossHint}
                                </p>
                            ) : null}

                            <Button
                                className="w-full bg-card"
                                variant="secondary"
                                data-analytics-label="onboarding_google"
                                disabled={isBusy}
                                onClick={() => {
                                    void (async () => {
                                        setIsBusy(true);
                                        auth.clearError();
                                        try {
                                            const session = await signInWithGoogle();
                                            auth.acceptSession(session);
                                            applyPendingOnboardingProfileAfterAuth(
                                                session.isNewUser === true,
                                            );
                                            trackAuthSuccess({
                                                method: "google",
                                                isNewUser: session.isNewUser === true,
                                            });
                                            await finishSuccess({
                                                isNewUser: session.isNewUser === true,
                                            });
                                        } catch (e) {
                                            if (isOAuthCancelledByUser(e)) return;
                                            console.error("[Auth] Google sign-in failed", e);
                                            trackAuthFailure({
                                                method: "google",
                                                context: "oauth",
                                            });
                                            auth.setError(oauthUserMessage(e, "google"));
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
                            {showAppleSignIn && (
                                <Button
                                    className="w-full bg-card"
                                    variant="secondary"
                                    data-analytics-label="onboarding_apple"
                                    disabled={isBusy}
                                    onClick={() => {
                                        void (async () => {
                                            setIsBusy(true);
                                            auth.clearError();
                                            try {
                                                const session = await signInWithApple();
                                                auth.acceptSession(session);
                                                applyPendingOnboardingProfileAfterAuth(
                                                    session.isNewUser === true,
                                                );
                                                trackAuthSuccess({
                                                    method: "apple",
                                                    isNewUser: session.isNewUser === true,
                                                });
                                                await finishSuccess({
                                                    isNewUser: session.isNewUser === true,
                                                });
                                            } catch (e) {
                                                if (isOAuthCancelledByUser(e)) return;
                                                console.error("[Auth] Apple sign-in failed", e);
                                                trackAuthFailure({
                                                    method: "apple",
                                                    context: "oauth",
                                                });
                                                auth.setError(oauthUserMessage(e, "apple"));
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
                                            <path d="M17.05 20.28c-.98.95-2.05 1.88-3.3 1.88-1.22 0-1.55-.79-2.9-.79-1.34 0-1.72.82-2.9.82-1.18 0-2.07-1.05-3.05-2.1C4.79 17.25 3.4 14.2 5.03 10.7c.82-1.6 2.28-2.61 3.87-2.61 1.21 0 2.35.82 3.17.82.78 0 2.01-.99 3.4-.84.58.02 2.22.24 3.27 1.82-.08.05-1.96 1.14-1.94 3.4.03 2.7 2.35 3.6 2.38 3.61-.03.07-.37 1.26-1.14 2.38zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                        </svg>
                                        <span>{UI.continueWithApple}</span>
                                    </span>
                                </Button>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border/60" />
                                <p className="text-xs text-muted-foreground">
                                    ou
                                </p>
                                <div className="h-px flex-1 bg-border/60" />
                            </div>

                            <Button
                                className="w-full bg-card"
                                variant="secondary"
                                data-analytics-label="onboarding_email_continue"
                                disabled={isBusy}
                                onClick={() => {
                                    auth.clearError();
                                    if (trackOnboardingAuth) {
                                        trackOnboardingStepCompleted({
                                            step: OnboardingSteps.PRE_REGISTRATION,
                                            method: "email",
                                        });
                                    }
                                    setStep("email");
                                }}
                            >
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Mail className="size-5" aria-hidden />
                                    <span>{UI.continueWithEmail}</span>
                                </span>
                            </Button>

                            <p className="pt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                                {UI.authLegalBefore}{" "}
                                <a
                                    href={CGU_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    {UI.authTermsOfUse}
                                </a>{" "}
                                {UI.authLegalAnd}{" "}
                                <a
                                    href={PRIVACY_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    {UI.authPrivacyPolicy}
                                </a>
                                .
                            </p>
                        </div>
                    </footer>
                </div>
            )}
        </Trackable>
    );

    if (embedded) {
        return content;
    }

    return (
        <OnboardingShell bleedTop={step === "methods"}>{content}</OnboardingShell>
    );
}
