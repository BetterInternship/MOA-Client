/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:27
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:04:59
 * @ Description: Custom hook for managing form field history (undo/redo)
 *                Handles all history state mutations
 */

import { useState, useCallback } from "react";
import type { FormField } from "@/components/docs/form-editor/field-box";

type HistoryState = {
  history: FormField[][];
  index: number;
};

export const useFormHistory = (initialFields: FormField[]) => {
  const [historyState, setHistoryState] = useState<HistoryState>({
    history: [initialFields],
    index: 0,
  });

  const updateFieldsWithHistory = useCallback((newFields: FormField[]) => {
    setHistoryState((prev) => {
      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(newFields);
      return { history: newHistory, index: newHistory.length - 1 };
    });
  }, []);

  const undo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index > 0) {
        return { ...prev, index: prev.index - 1 };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index < prev.history.length - 1) {
        return { ...prev, index: prev.index + 1 };
      }
      return prev;
    });
  }, []);

  const getCurrentFields = useCallback(() => {
    return historyState.history[historyState.index] || [];
  }, [historyState]);

  const canUndo = historyState.index > 0;
  const canRedo = historyState.index < historyState.history.length - 1;

  return {
    historyState,
    updateFieldsWithHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentFields,
  };
};
