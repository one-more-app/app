import { apiFetch } from "@/lib/api";

export type DeleteAccountPayload = {
  comment?: string;
};

export async function deleteAccount(payload: DeleteAccountPayload = {}) {
  return apiFetch<{ ok: true }>("/auth/account", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}
