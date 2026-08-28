import { UI } from "@/lib/translations";

export type OAuthProvider = "google" | "apple";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
    google: "Google",
    apple: "Apple",
};

/**
 * Erreur dont le message est déjà rédigé pour l'utilisateur (garde de plateforme).
 * Tout le reste est remplacé par un message générique : les erreurs natives
 * Google / Apple sont techniques et anxiogènes.
 */
export class OAuthUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "OAuthUnavailableError";
    }
}

/** Code posé par @capgo/capacitor-social-login quand la feuille native est fermée. */
const USER_CANCELLED_CODE = "USER_CANCELLED";

/** Codes natifs d'annulation, si le plugin ne renseigne pas USER_CANCELLED. */
const NATIVE_CANCEL_CODES = new Set([
    "-3", // OAuth2Provider iOS : User cancelled login
    "-5", // GIDSignIn : canceled
    "1001", // ASAuthorizationError.canceled
    "12501", // Google Play Services : SIGN_IN_CANCELLED
]);

function errorCode(error: unknown): string {
    if (error != null && typeof error === "object" && "code" in error) {
        const code = (error as { code?: unknown }).code;
        if (code != null) return String(code).trim();
    }
    return "";
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error ?? "");
}

/** L'utilisateur a fermé la feuille Google / Apple : ce n'est pas une erreur à afficher. */
export function isOAuthCancelledByUser(error: unknown): boolean {
    const code = errorCode(error);
    if (code === USER_CANCELLED_CODE || NATIVE_CANCEL_CODES.has(code)) {
        return true;
    }
    return /cancel/i.test(errorMessage(error));
}

/** Message affichable : jamais de détail technique ni de code natif. */
export function oauthUserMessage(
    error: unknown,
    provider: OAuthProvider,
): string {
    if (error instanceof OAuthUnavailableError && error.message.trim()) {
        return error.message;
    }
    return UI.oauthSignInError.replace("{provider}", PROVIDER_LABEL[provider]);
}
