import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { signInWithOAuth } from "@/lib/oauth";
import { UI } from "@/lib/translations";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function AuthPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const auth = useAuth();
    const rawRedirect = searchParams.get("redirect");
    const redirect = useMemo(() => {
        if (!rawRedirect) return "/settings";
        try {
            return decodeURIComponent(rawRedirect);
        } catch {
            return rawRedirect;
        }
    }, [rawRedirect]);
    const [mode, setMode] = useState<"login" | "register">(
        searchParams.get("mode") === "register" ? "register" : "login",
    );
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isBusy, setIsBusy] = useState(false);

    const canSubmit = useMemo(() => {
        if (!email.trim().includes("@") || password.length < 8) return false;
        if (mode !== "register") return true;
        return passwordConfirm === password;
    }, [email, password, passwordConfirm, mode]);

    const submit = async () => {
        if (!canSubmit || isBusy) return;
        setIsBusy(true);
        try {
            if (mode === "register") {
                if (passwordConfirm !== password) {
                    auth.setError(UI.passwordsDoNotMatch);
                    return;
                }
                await auth.register({ email: email.trim(), password });
            } else {
                await auth.login({ email: email.trim(), password });
            }
            navigate(redirect, { replace: true });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <h1 className="truncate text-lg font-semibold">{UI.account}</h1>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/settings">{UI.backToSettings}</Link>
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {mode === "register" ? UI.createAccount : UI.login}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {UI.accountSyncDescription}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{UI.email}</label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                inputMode="email"
                                autoCapitalize="none"
                                autoCorrect="off"
                                placeholder="email@exemple.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">{UI.password}</label>
                            <Input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-muted-foreground">
                                {UI.passwordHint}
                            </p>
                        </div>

                        {mode === "register" && (
                            <div className="space-y-1">
                                <label className="text-sm font-medium">{UI.confirmPassword}</label>
                                <Input
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    type="password"
                                    placeholder="••••••••"
                                />
                                {passwordConfirm.length > 0 && passwordConfirm !== password && (
                                    <p className="text-xs text-destructive">{UI.passwordsDoNotMatch}</p>
                                )}
                            </div>
                        )}

                        {auth.lastError && (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {auth.lastError}
                            </div>
                        )}

                        <Button className="w-full" onClick={() => void submit()} disabled={!canSubmit || isBusy}>
                            {mode === "register" ? UI.createAccount : UI.login}
                        </Button>

                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    auth.clearError();
                                    setMode((m) => (m === "login" ? "register" : "login"));
                                    setPasswordConfirm("");
                                }}
                            >
                                {mode === "login" ? UI.switchToRegister : UI.switchToLogin}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{UI.continueWith}</CardTitle>
                        <p className="text-sm text-muted-foreground">{UI.oauthComingSoon}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            variant="secondary"
                            className="w-full"
                            disabled={isBusy}
                            onClick={() => {
                                void (async () => {
                                    setIsBusy(true);
                                    auth.clearError();
                                    try {
                                        const session = await signInWithOAuth("google");
                                        auth.acceptSession(session);
                                        navigate(redirect, { replace: true });
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
                            {UI.continueWithGoogle}
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full"
                            disabled={isBusy}
                            onClick={() => {
                                void (async () => {
                                    setIsBusy(true);
                                    auth.clearError();
                                    try {
                                        const session = await signInWithOAuth("apple");
                                        auth.acceptSession(session);
                                        navigate(redirect, { replace: true });
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
                            {UI.continueWithApple}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

