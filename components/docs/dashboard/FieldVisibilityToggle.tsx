"use client";

import React, { useState } from "react";
import { EyeOff, ListMinus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
    
interface FieldVisibilityToggleProps {
  availableColumns: string[];
  visibleColumns: string[];
  onToggleColumn: (columnName: string) => void;
}

export default function FieldVisibilityToggle({
  availableColumns,
  visibleColumns,
  onToggleColumn,
}: FieldVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter columns based on search query
  const filteredColumns = availableColumns.filter(column =>
    column.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count hidden fields
  const hiddenCount = availableColumns.filter(col => !visibleColumns.includes(col)).length;

  const handleShowAll = () => {
    availableColumns.forEach(col => {
      if (!visibleColumns.includes(col)) {
        onToggleColumn(col);
      }
    });
  };

  const handleHideAll = () => {
    visibleColumns.forEach(col => {
      onToggleColumn(col);
    });
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <EyeOff className="h-4 w-4" />
        <span>Hide fields</span>
        {hiddenCount > 0 && (
          <span className="ml-1 rounded-full bg-gray-300 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {hiddenCount}
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-gray-300 bg-white shadow-lg">
          {/* Search Input */}
          <div className="border-b border-gray-200 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Find a field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded border border-gray-300 py-1.5 pl-10 pr-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Field List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredColumns.map((column) => {
              const isVisible = visibleColumns.includes(column);
              return (
                <div
                  key={column}
                  className="flex cursor-pointer items-center px-4 py-2 hover:bg-gray-50"
                  onClick={() => onToggleColumn(column)}
                >
                  {/* Toggle Switch */}
                  <div className="mr-3">
                    <div
                      className={`flex h-5 w-10 items-center rounded-full transition-colors ${
                        isVisible ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                          isVisible ? "translate-x-5.5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Field Name */}
                  <div className="flex items-center gap-2">
                    <ListMinus className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-800">{column}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between border-t border-gray-200 p-3">
            <button
              onClick={handleHideAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Hide all
            </button>
            <button
              onClick={handleShowAll}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Show all
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
