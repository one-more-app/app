import { Trackable } from "./Trackable";
import { resolvePageName } from "@/lib/analytics";
import { useLocation } from "react-router-dom";

/**
 * Enveloppe automatique de chaque page avec `section` = nom de page normalisé.
 * Tous les clics héritent du contexte sans modifier chaque page.
 */
export function PageSection({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <Trackable section={resolvePageName(pathname)}>{children}</Trackable>
  );
}
