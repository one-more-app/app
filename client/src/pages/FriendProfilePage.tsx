import { ProfileView } from "@/components/profile/ProfileView";
import { fetchFriendProfile } from "@/lib/social-api";
import { getProfileDisplayName } from "@/lib/profile-display";
import { UI } from "@/lib/translations";
import useSWR from "swr";
import { useParams } from "react-router-dom";

export default function FriendProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading, error } = useSWR(
    userId ? ["friend-profile", userId] : null,
    () => fetchFriendProfile(userId!),
  );

  const pageTitle = data?.profile
    ? getProfileDisplayName(data.profile, null)
    : UI.profile;

  return (
    <ProfileView
      pageTitle={pageTitle}
      readOnly
      data={{
        profile: data?.profile,
        progress: data?.progress,
        exercises: data?.exercises ?? [],
        performanceEntries: data?.performanceEntries ?? [],
        isLoading,
        error: Boolean(error),
      }}
    />
  );
}
