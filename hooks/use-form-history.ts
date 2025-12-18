/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:27
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 14:59:41
 * @ Description: Custom hook for managing form field history (undo/redo)
 *                Handles all history state mutations
 */

import { useState, useCallback } from "react";
import type { FormField } from "@/components/docs/form-editor/form-pdf-editor/FieldBox";

type HistoryState = {
  history: FormField[][];
  index: number;
};

export const useFormHistory = (initialFields: FormField[]) => {
  const [historyState, setHistoryState] = useState<HistoryState>({
    history: [JSON.parse(JSON.stringify(initialFields))],
    index: 0,
  });

  const updateFieldsWithHistory = useCallback((newFields: FormField[]) => {
    setHistoryState((prev) => {
      // Only add to history if the new state is different from current
      const currentFields = prev.history[prev.index];
      if (JSON.stringify(currentFields) === JSON.stringify(newFields)) {
        return prev; // No change, don't update history
      }

      const newHistory = prev.history.slice(0, prev.index + 1);
      newHistory.push(JSON.parse(JSON.stringify(newFields)));
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
