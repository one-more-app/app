import {
  APP_BACK_HOME_PATH,
  canGoBackInAppHistory,
  isAppBackExitRoute,
} from "@/lib/app-back-navigation";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Retour in-app (header). Utilise l'historique React Router.
 * Sans entrée précédente : accueil, plutôt que de sortir de l'app.
 */
export function useBack() {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (canGoBackInAppHistory()) {
      navigate(-1);
      return;
    }
    if (!isAppBackExitRoute(location.pathname)) {
      navigate(APP_BACK_HOME_PATH, { replace: true });
    }
  };
}
