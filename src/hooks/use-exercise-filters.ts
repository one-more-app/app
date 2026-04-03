import {
  parseEquipmentSelection,
  serializeEquipmentSelection,
  type EquipmentSelection,
} from "@/lib/equipment-filter";
import { inferBodyPartFromTarget } from "@/lib/infer-body-part-from-target";
import {
  parseMuscleSelection,
  serializeMuscleSelection,
  type MuscleSelection,
} from "@/lib/muscle-filter";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export type ExerciseSortMode = "default" | "perfAdded";

export interface UseExerciseFiltersOptions {
  /** Pagination (liste catalogue exercices) */
  includePage?: boolean;
  /** Tri par date du dernier enregistrement de performance (`?sort=perfAdded`) */
  includeSort?: boolean;
}

function readMuscleFilter(searchParams: URLSearchParams): MuscleSelection {
  const raw = searchParams.get("muscle");
  if (raw) return parseMuscleSelection(raw);

  const target = searchParams.get("target");
  const bodyPart = searchParams.get("bodyPart");
  if (target && target !== "all") {
    const g =
      inferBodyPartFromTarget(target) ??
      (bodyPart && bodyPart !== "all" ? bodyPart : undefined);
    if (g) return { [g.toLowerCase()]: [target.toLowerCase()] };
  }
  if (bodyPart && bodyPart !== "all") {
    return { [bodyPart.toLowerCase()]: "all" };
  }
  return {};
}

export function useExerciseFilters(options: UseExerciseFiltersOptions = {}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const muscleFilter = useMemo(
    () => readMuscleFilter(searchParams),
    [searchParams],
  );

  const equipmentFilter: EquipmentSelection = useMemo(
    () => parseEquipmentSelection(searchParams.get("eq")),
    [searchParams],
  );

  const sortMode: ExerciseSortMode = useMemo(() => {
    if (!options.includeSort) return "default";
    const s = searchParams.get("sort");
    return s === "perfAdded" ? "perfAdded" : "default";
  }, [searchParams, options.includeSort]);

  const page = useMemo(
    () =>
      options.includePage
        ? Math.max(0, parseInt(searchParams.get("page") || "0", 10))
        : 0,
    [searchParams, options.includePage],
  );

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") || "",
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") || "",
  );

  const qParam = searchParams.get("q") || "";
  useEffect(() => {
    setSearchInput(qParam);
    setSearchQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const navigateWithParams = useCallback(
    (mutate: (p: URLSearchParams) => void, replace = true) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      const search = next.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace },
      );
    },
    [searchParams, navigate, location.pathname],
  );

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const currentQ = next.get("q") || "";
    if (currentQ !== searchQuery) {
      if (searchQuery) next.set("q", searchQuery);
      else next.delete("q");
      if (options.includePage) next.delete("page");
      const search = next.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: true },
      );
    }
  }, [
    searchQuery,
    searchParams,
    navigate,
    location.pathname,
    options.includePage,
  ]);

  const handleMuscleFilterChange = useCallback(
    (next: MuscleSelection) => {
      navigateWithParams((p) => {
        p.delete("target");
        p.delete("bodyPart");
        const s = serializeMuscleSelection(next);
        if (!s) p.delete("muscle");
        else p.set("muscle", s);
        if (options.includePage) p.delete("page");
      });
    },
    [navigateWithParams, options.includePage],
  );

  const handleEquipmentChange = useCallback(
    (value: EquipmentSelection) => {
      navigateWithParams((p) => {
        const s = serializeEquipmentSelection(value);
        if (!s) p.delete("eq");
        else p.set("eq", s);
        if (options.includePage) p.delete("page");
      });
    },
    [navigateWithParams, options.includePage],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handlePageChange = useCallback(
    (delta: number) => {
      const newPage = Math.max(0, page + delta);
      navigateWithParams((p) => {
        if (newPage === 0) p.delete("page");
        else p.set("page", String(newPage));
      });
    },
    [page, navigateWithParams],
  );

  return {
    searchInput,
    searchQuery,
    muscleFilter,
    equipmentFilter,
    sortMode: options.includeSort ? sortMode : undefined,
    page: options.includePage ? page : undefined,
    handleMuscleFilterChange,
    handleEquipmentChange,
    handleSearchChange,
    handlePageChange,
  };
}
