import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

export interface ExerciseFilterParams {
  target: string;
  eq: string;
  q: string;
  bodyPart?: string;
  page?: number;
}

export interface UseExerciseFiltersOptions {
  /** Inclure le filtre partie du corps (Home) */
  includeBodyPart?: boolean;
  /** Inclure la pagination (liste exercices) */
  includePage?: boolean;
}

function getParamsFromUrl(
  searchParams: URLSearchParams,
  options: UseExerciseFiltersOptions = {},
): ExerciseFilterParams {
  const params: ExerciseFilterParams = {
    target: searchParams.get("target") || "all",
    eq: searchParams.get("eq") || "all",
    q: searchParams.get("q") || "",
  };
  if (options.includeBodyPart) {
    params.bodyPart = searchParams.get("bodyPart") || "all";
  }
  if (options.includePage) {
    params.page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
  }
  return params;
}

export function useExerciseFilters(options: UseExerciseFiltersOptions = {}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const paramsFromUrl = getParamsFromUrl(searchParams, options);

  const [targetFilter, setTargetFilter] = useState(paramsFromUrl.target);
  const [equipmentFilter, setEquipmentFilter] = useState(paramsFromUrl.eq);
  const [searchInput, setSearchInput] = useState(paramsFromUrl.q);
  const [searchQuery, setSearchQuery] = useState(paramsFromUrl.q);
  const [bodyPartFilter, setBodyPartFilter] = useState(
    paramsFromUrl.bodyPart ?? "all",
  );
  const [page, setPage] = useState(paramsFromUrl.page ?? 0);

  // Sync state from URL (back/forward navigation)
  useEffect(() => {
    const p = getParamsFromUrl(searchParams, options);
    setTargetFilter(p.target);
    setEquipmentFilter(p.eq);
    setSearchInput(p.q);
    setSearchQuery(p.q);
    if (options.includeBodyPart) setBodyPartFilter(p.bodyPart ?? "all");
    if (options.includePage) setPage(p.page ?? 0);
  }, [searchParams, options.includeBodyPart, options.includePage]);

  // Debounce search input -> searchQuery
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const updateUrl = (
    updates: Partial<ExerciseFilterParams> & { page?: number },
    replace = true,
  ) => {
    const next = new URLSearchParams(searchParams);
    if (updates.target !== undefined) {
      if (updates.target === "all") next.delete("target");
      else next.set("target", updates.target);
    }
    if (updates.eq !== undefined) {
      if (updates.eq === "all") next.delete("eq");
      else next.set("eq", updates.eq);
    }
    if (updates.q !== undefined) {
      if (updates.q) next.set("q", updates.q);
      else next.delete("q");
    }
    if (options.includeBodyPart && updates.bodyPart !== undefined) {
      if (updates.bodyPart === "all") next.delete("bodyPart");
      else next.set("bodyPart", updates.bodyPart);
    }
    if (options.includePage && updates.page !== undefined) {
      if (updates.page === 0) next.delete("page");
      else next.set("page", String(updates.page));
    }
    const search = next.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace },
    );
  };

  // Update URL when search query changes (replace to avoid history spam while typing)
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

  const handleTargetChange = (value: string) => {
    setTargetFilter(value);
    if (options.includePage) {
      setPage(0);
      updateUrl({ target: value, page: 0 });
    } else {
      updateUrl({ target: value });
    }
  };

  const handleEquipmentChange = (value: string) => {
    setEquipmentFilter(value);
    if (options.includePage) {
      setPage(0);
      updateUrl({ eq: value, page: 0 });
    } else {
      updateUrl({ eq: value });
    }
  };

  const handleBodyPartChange = (value: string) => {
    setBodyPartFilter(value);
    updateUrl({ bodyPart: value });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (options.includePage) setPage(0);
  };

  const handlePageChange = (delta: number) => {
    const newPage = Math.max(0, page + delta);
    setPage(newPage);
    updateUrl({ page: newPage });
  };

  return {
    searchInput,
    searchQuery,
    targetFilter,
    equipmentFilter,
    bodyPartFilter: options.includeBodyPart ? bodyPartFilter : undefined,
    page: options.includePage ? page : undefined,
    setTargetFilter,
    setEquipmentFilter,
    setBodyPartFilter,
    updateUrl,
    handleTargetChange,
    handleEquipmentChange,
    handleBodyPartChange,
    handleSearchChange,
    handlePageChange,
  };
}
