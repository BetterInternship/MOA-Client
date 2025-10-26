/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-10-26 12:42:20
 * @ Modified time: 2025-10-26 13:08:48
 * @ Description:
 *
 * Creds to J. Bantolino for the original code; modified later on but original concept is the same.
 */

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ModalOptions = {
  // Allows exiting the modal through clicking backdrop
  // default: true
  allowBackdropClick?: boolean;

  // Allows exiting the modal through the escape button
  // default: true
  closeOnEsc?: boolean;

  // Whether or not to show an exit button at the upper right corner
  // default: true
  hasClose?: boolean;

  // Other customizations
  title?: React.ReactNode;
  headerClassName?: string;
  panelClassName?: string;
  backdropClassName?: string;
  showHeaderDivider?: boolean;

  // Called AFTER the modal is unmounted
  onClose?: () => void;
};

type RegistryEntry = { contentNode: React.ReactNode; options: ModalOptions };
type Open = (name: string, contentNode: React.ReactNode, options?: ModalOptions) => void;
type Close = (name?: string) => void;

const ModalCtx = createContext<{ open: Open; close: Close }>({
  open: () => {},
  close: () => {},
});

// This used to be called useGlobalModal
// But because we will replace useModal with this, might as well rename it
export const useModal = () => useContext(ModalCtx);

/**
 * Modal provider allows us to manage modals globally without drilling props.
 * Saves us our sanity with modal state-management
 *
 * @provider
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModalRegistry, setActiveModalRegistry] = useState<Record<string, RegistryEntry>>({});

  // Opens the specified modal with the given content, and registers it in registry
  const open = useCallback<Open>((name, content, opts = {}) => {
    setActiveModalRegistry((m) => ({ ...m, [name]: { contentNode: content, options: opts } }));
  }, []);

  // Closes all currently open modals, or a specified one
  const close = useCallback<Close>((name) => {
    setActiveModalRegistry((m) => {
      // Just close everything
      if (!name) {
        Object.values(m).forEach((e) => e.options.onClose?.());
        return {};
      }

      // Close specific one
      const entry = m[name];
      entry?.options.onClose?.();
      const { [name]: _removed, ...rest } = m;
      return rest;
    });
  }, []);

  // Body scroll lock + iOS --vh fix when ANY modal is open
  useEffect(() => {
    const count = Object.keys(activeModalRegistry).length;
    if (count === 0) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const setVH = () =>
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.removeProperty("--vh");
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, [activeModalRegistry]);

  // ESC to close the top-most modal that allows it
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const entries = Object.entries(activeModalRegistry);
      if (!entries.length) return;
      const [lastName, lastEntry] = entries[entries.length - 1];
      if (lastEntry.options.closeOnEsc !== false) close(lastName);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activeModalRegistry, close]);

  // Portals to the actual modal component
  const portals = useMemo(() => {
    const entries = Object.entries(activeModalRegistry);
    if (!entries.length) return null;

    return createPortal(
      <AnimatePresence>
        {entries.map(([name, { contentNode, options }]) => (
          <ModalWrapper name={name} options={options} close={close}>
            {contentNode}
          </ModalWrapper>
        ))}
      </AnimatePresence>,
      document.body
    );
  }, [activeModalRegistry, close]);

  return (
    <ModalCtx.Provider value={{ open, close }}>
      {children}
      {portals}
    </ModalCtx.Provider>
  );
}

/**
 * Wraps around every modal.
 * Contains backdrop styling, etc.
 *
 * @component
 */
const ModalWrapper = ({
  name,
  children,
  options,
  close,
}: {
  name: string;
  children: React.ReactNode;
  options: ModalOptions;
  close: (name?: string) => void;
}) => {
  const backdropRef = React.createRef<HTMLDivElement>();

  // Exit modal when clicking outside (if allowed)
  const handleBackdropClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (options.allowBackdropClick === false) return;
    if (e.target === backdropRef.current) close(name);
  };

  return (
    <motion.div
      key={name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        // Backdrop container
        "fixed inset-0 z-[1000] bg-black/10 backdrop-blur-sm",
        // Mobile: dock to bottom; Desktop+: center
        "flex items-end justify-center p-0",
        "sm:items-center sm:justify-center sm:p-4",
        options.backdropClassName ?? ""
      )}
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      style={{
        height: "calc(var(--vh, 1vh) * 100)",
      }}
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropClick}
    >
      <motion.div
        // Panel entrance: bottom-sheet slide on mobile, scale/raise on desktop
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 28,
          mass: 0.8,
        }}
        className={[
          // Base panel
          "relative overflow-hidden border bg-white shadow-2xl",
          // Mobile: full-width bottom sheet, rounded top only
          "w-full max-w-full min-w-[100svw] rounded-t-[0.33em] rounded-b-none",
          // Let content grow but cap height properly
          "max-h-[calc(var(--vh,1vh)*100)]",
          // Desktop+: classic centered card
          "sm:max-h-[90vh] sm:w-auto sm:max-w-2xl sm:min-w-0 sm:rounded-[0.33em]",
          options.panelClassName ?? "",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row: title (left) + close (right) */}
        {(options.title || options.hasClose !== false) && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 px-4 py-3",
              options.showHeaderDivider ? "border-b" : "",
              options.headerClassName ?? ""
            )}
          >
            {options.title ? (
              typeof options.title === "string" ? (
                <h2 className="truncate text-base font-semibold">{options.title}</h2>
              ) : (
                <div className="min-w-0 flex-1">{options.title}</div>
              )
            ) : (
              <div className="flex-1" />
            )}
            {options.hasClose !== false && (
              <button
                aria-label="Close"
                onClick={() => close(name)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div className="">
          <div className="max-h-[calc(var(--vh,1vh)*100-4rem)] overflow-auto px-4 pb-4 sm:max-h-[calc(90vh-4rem)]">
            {children}
          </div>
        </div>

        {/* Mobile safe area spacer */}
        <div className="pb-safe h-4 sm:hidden" />
      </motion.div>
    </motion.div>
  );
};
