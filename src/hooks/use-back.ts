import { useNavigate } from 'react-router-dom'

/**
 * Retourne une fonction pour naviguer en arrière.
 * Utilise l'historique du navigateur pour un comportement cohérent :
 * chaque appui sur "retour" remonte d'une page dans la pile.
 */
export function useBack() {
  const navigate = useNavigate()
  return () => navigate(-1)
}
