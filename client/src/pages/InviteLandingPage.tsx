import { BackHeader } from "@/components/BackHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchInvitePreview,
  requestFriendFromInvite,
} from "@/lib/social-api";
import { extractInviteCodeFromAttribution } from "@/lib/appsflyer";
import {
  consumePendingInviteCode,
  setPendingInviteCode,
} from "@/lib/invite-code";
import { UI } from "@/lib/translations";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function InviteLandingPage() {
  const { code } = useParams<{ code: string }>();
  const auth = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<{
    firstName: string | null;
    avatarUrl: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) return;
    const fromQuery = extractInviteCodeFromAttribution(
      Object.fromEntries(new URLSearchParams(window.location.search).entries()),
    );
    if (fromQuery) {
      navigate(`/invite/${fromQuery}`, { replace: true });
    }
  }, [code, navigate]);

  useEffect(() => {
    if (!code) return;
    setPendingInviteCode(code);
    void (async () => {
      try {
        const data = await fetchInvitePreview(code);
        setPreview({
          firstName: data.firstName,
          avatarUrl: data.avatarUrl,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  useEffect(() => {
    if (auth.status !== "authenticated" || !code) return;
    void (async () => {
      try {
        await requestFriendFromInvite(code);
        consumePendingInviteCode();
        toast.success(UI.inviteRequestSent);
        navigate("/friends", { replace: true });
      } catch {
        navigate("/friends", { replace: true });
      }
    })();
  }, [auth.status, code, navigate]);

  const inviterName = preview?.firstName?.trim() || UI.profileDefaultName;

  return (
    <div className="min-h-screen-app bg-background">
      <BackHeader title={UI.inviteLandingTitle} />
      <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">{UI.loading}</p>
        ) : error ? (
          <p className="text-center text-sm text-destructive">{UI.inviteNotFound}</p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              {preview?.avatarUrl ? (
                <img
                  src={preview.avatarUrl}
                  alt=""
                  className="size-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {inviterName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold">{UI.inviteLandingHeading}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {UI.inviteLandingBody.replace("{name}", inviterName)}
                </p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link to="/auth">{UI.inviteLandingCta}</Link>
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
