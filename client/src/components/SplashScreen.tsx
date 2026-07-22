import { OneMoreLogoMark } from "@/components/OneMoreLogoMark";
import { UI } from "@/lib/translations";

export function SplashScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-6"
      role="status"
      aria-busy="true"
      aria-label={UI.loading}
    >
      <OneMoreLogoMark animate />
    </div>
  );
}
