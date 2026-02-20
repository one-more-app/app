"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function SubscribeForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStatus("error");
                setMessage(data?.error || "Une erreur est survenue.");
                return;
            }
            setStatus("success");
            setEmail("");
            setMessage("Merci ! On te prévient dès le lancement.");
        } catch {
            setStatus("error");
            setMessage("Erreur réseau.");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                    <Label htmlFor="email" className="sr-only">
                        Ton email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="ton@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === "loading"}
                        required
                        className="w-full"
                    />
                </div>
                <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={status === "loading"}
                    className="shrink-0"
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 className="size-4 animate-spin" />
                            Envoi…
                        </>
                    ) : (
                        "Pré-inscription"
                    )}
                </Button>
            </div>
            {message && (
                <p
                    role="alert"
                    className={`text-sm text-center sm:text-left ${status === "success" ? "text-accent" : "text-destructive"
                        }`}
                >
                    {message}
                </p>
            )}
        </form>
    );
}
