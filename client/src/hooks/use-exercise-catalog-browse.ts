import {
  parseCatalogBrowseStep,
  type CatalogBrowseParams,
  type CatalogBrowseStep,
} from "@/lib/exercise-catalog-browse";
import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

function readBrowseParams(searchParams: URLSearchParams): CatalogBrowseParams {
  return {
    step: parseCatalogBrowseStep(searchParams.get("step")),
    zone: searchParams.get("zone")?.toLowerCase() ?? null,
    target: searchParams.get("target")?.toLowerCase() ?? null,
    beq: searchParams.get("beq")?.toLowerCase() ?? null,
  };
}

function writeBrowseParams(
  base: URLSearchParams,
  browse: CatalogBrowseParams,
): void {
  if (browse.step === "zone") {
    base.delete("step");
    base.delete("zone");
    base.delete("target");
    base.delete("beq");
    return;
  }
  base.set("step", browse.step);
  if (browse.zone) base.set("zone", browse.zone);
  else base.delete("zone");
  if (browse.target) base.set("target", browse.target);
  else base.delete("target");
  if (browse.beq) base.set("beq", browse.beq);
  else base.delete("beq");
}

export function useExerciseCatalogBrowse(options?: {
  /** Remplace l’historique à chaque étape (ex. parcours d’ajout sur /exercises). */
  replaceOnNavigate?: boolean;
}) {
  const replaceOnNavigate = options?.replaceOnNavigate ?? false;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const browse = readBrowseParams(searchParams);

  const navigateBrowse = useCallback(
    (
      nextBrowse: CatalogBrowseParams,
      navigateOptions?: {
        replace?: boolean;
      },
    ) => {
      const params = new URLSearchParams(searchParams);
      writeBrowseParams(params, nextBrowse);
      params.delete("page");
      params.delete("muscle");
      params.delete("eq");

      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: navigateOptions?.replace ?? replaceOnNavigate },
      );
    },
    [searchParams, navigate, location.pathname, replaceOnNavigate],
  );

  const pickZone = useCallback(
    (zone: string) => {
      navigateBrowse({
        step: "muscle",
        zone: zone.toLowerCase(),
        target: null,
        beq: null,
      });
    },
    [navigateBrowse],
  );

  const pickTarget = useCallback(
    (target: string) => {
      if (!browse.zone) return;
      navigateBrowse({
        step: "equipment",
        zone: browse.zone,
        target: target.toLowerCase(),
        beq: null,
      });
    },
    [browse.zone, navigateBrowse],
  );

  const pickEquipment = useCallback(
    (equipment: string) => {
      if (!browse.zone || !browse.target) return;
      navigateBrowse({
        step: "list",
        zone: browse.zone,
        target: browse.target,
        beq: equipment.toLowerCase(),
      });
    },
    [browse.zone, browse.target, navigateBrowse],
  );

  const goToStep = useCallback(
    (step: CatalogBrowseStep, options?: { replace?: boolean }) => {
      if (step === "zone") {
        navigateBrowse(
          { step: "zone", zone: null, target: null, beq: null },
          options,
        );
        return;
      }
      if (step === "muscle" && browse.zone) {
        navigateBrowse(
          {
            step: "muscle",
            zone: browse.zone,
            target: null,
            beq: null,
          },
          options,
        );
        return;
      }
      if (step === "equipment" && browse.zone && browse.target) {
        navigateBrowse(
          {
            step: "equipment",
            zone: browse.zone,
            target: browse.target,
            beq: null,
          },
          options,
        );
      }
    },
    [browse.zone, browse.target, navigateBrowse],
  );

  /** Recule d’une étape du parcours (list → equipment → muscle → zone). Retourne false si déjà à la zone. */
  const goBackInBrowse = useCallback((): boolean => {
    if (browse.step === "list" && browse.zone && browse.target) {
      navigateBrowse(
        {
          step: "equipment",
          zone: browse.zone,
          target: browse.target,
          beq: null,
        },
        { replace: true },
      );
      return true;
    }
    if (browse.step === "equipment" && browse.zone) {
      navigateBrowse(
        {
          step: "muscle",
          zone: browse.zone,
          target: null,
          beq: null,
        },
        { replace: true },
      );
      return true;
    }
    if (browse.step === "muscle" && browse.zone) {
      navigateBrowse(
        { step: "zone", zone: null, target: null, beq: null },
        { replace: true },
      );
      return true;
    }
    return false;
  }, [browse.step, browse.zone, browse.target, navigateBrowse]);

  return {
    browse,
    pickZone,
    pickTarget,
    pickEquipment,
    goToStep,
    goBackInBrowse,
  };
}
