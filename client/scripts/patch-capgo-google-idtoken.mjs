/**
 * Patches Capgo GoogleProvider for One More:
 * 1. Resolve with id_token only (no access-token authorization step)
 * 2. Forward real GetCredentialException message to JS
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(
  root,
  "node_modules/@capgo/capacitor-social-login/android/src/main/java/ee/forgr/capacitor/social/login/GoogleProvider.java",
);

let source;
try {
  source = readFileSync(target, "utf8");
} catch {
  console.warn("[patch-capgo] GoogleProvider.java introuvable — skip");
  process.exit(0);
}

let changed = false;

const idTokenMarker = "One More n'a besoin que de l'id_token";
const idTokenNeedle = `                    GoogleIdTokenCredential googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.getData());
                    ListenableFuture<AuthorizationResult> future = getAuthorizationResult(forceRefreshToken);`;

const idTokenReplacement = `                    GoogleIdTokenCredential googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.getData());

                    // One More n'a besoin que de l'id_token (POST /oauth/google/id-token).
                    resultObj.put("profile", user);
                    resultObj.put("idToken", googleIdTokenCredential.getIdToken());
                    resultObj.put("responseType", "online");
                    response.put("result", resultObj);
                    try {
                        persistState(googleIdTokenCredential.getIdToken(), null);
                    } catch (JSONException e) {
                        Log.w(LOG_TAG, "persistState failed", e);
                    }
                    call.resolve(response);
                    return;`;

if (!source.includes(idTokenMarker) && source.includes(idTokenNeedle)) {
  const blockStart = source.indexOf(idTokenNeedle);
  const returnMarker = "return; // The call will be resolved in the Runnable";
  const blockEnd = source.indexOf(returnMarker, blockStart);
  if (blockEnd !== -1) {
    const endIndex = blockEnd + returnMarker.length;
    source = source.slice(0, blockStart) + idTokenReplacement + source.slice(endIndex);
    changed = true;
    console.log("[patch-capgo] id_token sans access token");
  }
}

const cancelNeedle =
  'call.reject("Google Sign-In cancelled by user", USER_CANCELLED_CODE, e);';
const cancelReplacement =
  'call.reject("Google Sign-In failed: " + e.getMessage(), USER_CANCELLED_CODE, e);';

if (source.includes(cancelNeedle)) {
  source = source.replace(cancelNeedle, cancelReplacement);
  changed = true;
  console.log("[patch-capgo] message d'erreur Google réel");
}

if (changed) {
  writeFileSync(target, source, "utf8");
}
