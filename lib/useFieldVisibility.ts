import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "airtable-field-visibility";

export function useFieldVisibility() {
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});

  // Load visibility state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setVisibilityState(JSON.parse(saved) as Record<string, boolean>);
      } catch (e) {
        console.error("Failed to load visibility state", e);
      }
    }
  }, []);

  // Save visibility state to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(visibilityState).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visibilityState));
    }
  }, [visibilityState]);

  // Initialize visibility state when columns are first extracted
  const handleColumnsExtracted = useCallback((columns: string[]) => {
    setAllColumns((prev) => {
      // Only update if columns actually changed
      if (prev.length === columns.length && prev.every((col, i) => col === columns[i])) {
        return prev;
      }
      
      // Initialize visibility for new columns (default to visible)
      setVisibilityState((current) => {
        const newState = { ...current };
        columns.forEach((col) => {
          if (!(col in newState)) {
            newState[col] = true;
          }
        });
        return newState;
      });
      
      return columns;
    });
  }, []);

  // Toggle individual field
  const toggleField = useCallback((fieldName: string) => {
    setVisibilityState((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  }, []);

  // Show all fields
  const showAll = useCallback(() => {
    setVisibilityState((prev) => {
      const newState = { ...prev };
      allColumns.forEach((col) => {
        newState[col] = true;
      });
      return newState;
    });
  }, [allColumns]);

  // Hide all fields
  const hideAll = useCallback(() => {
    setVisibilityState((prev) => {
      const newState = { ...prev };
      allColumns.forEach((col) => {
        newState[col] = false;
      });
      return newState;
    });
  }, [allColumns]);

  // Get only visible columns
  const visibleColumns = allColumns.filter((col) => visibilityState[col] !== false);

  return {
    allColumns,
    visibilityState,
    visibleColumns,
    handleColumnsExtracted,
    toggleField,
    showAll,
    hideAll,
  };
}
