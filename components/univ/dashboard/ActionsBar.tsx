// components/univ/dashboard/ActionsBar.tsx
"use client";

import { ShieldAlert } from "lucide-react";

export default function ActionsBar({ onBlacklist }: { onBlacklist?: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">Actions</h2>
      <button
        onClick={onBlacklist}
        className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:cursor-pointer hover:bg-rose-100"
      >
        <ShieldAlert className="mr-2 h-4 w-4" />
        Blacklist Company
      </button>
    </div>
  );
}
