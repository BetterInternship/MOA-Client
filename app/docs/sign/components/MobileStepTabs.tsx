"use client";

import { cn } from "@/lib/utils";

type MobileStepTab = {
  id: string;
  label: string;
  attentionState?: boolean;
};

type MobileStepTabsProps = {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: MobileStepTab[];
};

export function MobileStepTabs({ activeTab, onTabChange, tabs }: MobileStepTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div
        className="grid border-b border-gray-200 bg-gray-100"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          const showAttentionIndicator = tab.attentionState !== undefined;

          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors",
                index < tabs.length - 1 && "border-r border-gray-200",
                isActive ? "text-primary bg-slate-50" : "text-gray-600",
                !isActive && tab.attentionState && "bg-blue-100"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-4 py-1.5 transition-[transform,background-color] duration-200",
                  isActive ? "bg-primary/10" : "bg-transparent",
                  tab.attentionState ? "relative translate-x-1.5" : "translate-x-0"
                )}
              >
                {showAttentionIndicator && (
                  <span className="absolute top-1/2 -left-4 -translate-y-1/2" aria-hidden="true">
                    <span
                      className={cn(
                        "bg-primary block h-2.5 w-2.5 rounded-full transition-all duration-200",
                        tab.attentionState
                          ? "tab-attention-dot-jitter scale-100 opacity-100"
                          : "scale-75 opacity-0"
                      )}
                    />
                  </span>
                )}
                <span className={cn(tab.attentionState && "tab-attention-jitter")}>
                  {tab.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
