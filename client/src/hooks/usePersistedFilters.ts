import { useState, useEffect } from "react";

export interface FilterState {
  selectedPhases: string[];
  selectedRegion: string;
  selectedLicenses: string[];
  search: string;
  sortBy: 'created' | 'updated';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: FilterState = {
  selectedPhases: [],
  selectedRegion: "",
  selectedLicenses: [],
  search: "",
  sortBy: 'created',
  sortOrder: 'desc',
};

export function usePersistedFilters(storageKey: string = "candidates-filters") {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Load filters from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedFilters = JSON.parse(saved) as FilterState;
        setFilters(parsedFilters);
      }
    } catch (error) {
      console.error("Error loading filters from localStorage:", error);
    }
  }, [storageKey]);

  // Save filters to localStorage whenever they change
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedFilters));
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing filters from localStorage:", error);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.selectedPhases.length > 0 ||
           filters.selectedRegion !== "" ||
           filters.selectedLicenses.length > 0 ||
           filters.search !== "";
  };

  return {
    filters,
    updateFilters,
    clearAllFilters,
    hasActiveFilters,
  };
}