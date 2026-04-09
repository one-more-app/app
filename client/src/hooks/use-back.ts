import { useNavigate } from "react-router-dom";

/**
 * Retourne une fonction pour naviguer en arrière.
 * Utilise l'historique du navigateur pour un comportement cohérent :
 * chaque appui sur "retour" remonte d'une page dans la pile.
 *
 * Selon l'API React Router useNavigate :
 * https://reactrouter.com/api/hooks/useNavigate
 * navigate(delta) avec delta = -1 pour revenir en arrière.
 */
export function useBack() {
  const navigate = useNavigate();
  return () => navigate(-1);
}
