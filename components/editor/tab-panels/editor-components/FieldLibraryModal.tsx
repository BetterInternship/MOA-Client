"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { FieldRegistryEntry } from "@/app/api";
import { Card } from "@/components/ui/card";
import { Search, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FieldRegistryEntry[];
}

export function FieldLibraryModal({ open, onOpenChange, fields }: FieldLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedField, setDraggedField] = useState<FieldRegistryEntry | null>(null);

  // Filter fields based on search
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fields;
    const query = searchQuery.toLowerCase();
    return fields.filter(
      (field) =>
        field.name?.toLowerCase().includes(query) ||
        field.label?.toLowerCase().includes(query) ||
        field.description?.toLowerCase().includes(query)
    );
  }, [fields, searchQuery]);

  const handleDragStart = (e: React.DragEvent, field: FieldRegistryEntry) => {
    setDraggedField(field);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("field", JSON.stringify(field));
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Field Library</DialogTitle>
          <DialogDescription>
            Drag fields to the form to add them. Search to filter available fields.
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Fields Grid */}
        <div className="flex-1 overflow-auto">
          {filteredFields.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No fields found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-2">
              {filteredFields.map((field) => (
                <Card
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "cursor-move border-2 p-4 transition-all",
                    draggedField?.id === field.id
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "hover:border-primary/30 border-transparent hover:shadow-md"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-foreground text-sm font-semibold">
                          {field.label || field.name}
                        </h4>
                        <p className="text-muted-foreground font-mono text-xs">{field.name}</p>
                      </div>
                      <Copy className="text-muted-foreground/40 h-4 w-4 flex-shrink-0" />
                    </div>

                    {field.description && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {field.description}
                      </p>
                    )}

                    {/* Field Type Badges */}
                    {field.field_type && (
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                          {field.field_type}
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    {field.category && (
                      <div className="text-muted-foreground/60 text-xs">
                        Category: {field.category}
                      </div>
                    )}
                  </div>

                  {draggedField?.id === field.id && (
                    <div className="border-primary pointer-events-none absolute inset-0 rounded-lg border-2" />
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-muted-foreground border-t pt-2 text-center text-xs">
          {filteredFields.length} field{filteredFields.length !== 1 ? "s" : ""} available
        </div>
      </DialogContent>
    </Dialog>
  );
}
