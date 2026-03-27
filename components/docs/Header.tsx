"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, X as XIcon, LogOut, ChevronRight, Loader2, Newspaper, Settings, Search, SearchCheck } from "lucide-react";
import { logoutSignatory } from "@/app/api/docs.api";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";

export default function DocsTopbarUser() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const profile = useSignatoryProfile();
  const isLoggedIn = Boolean(profile?.email);
  const isMobile = useIsMobile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: logoutSignatory,
    onSuccess: async () => {
      // Show loading with preset styling
      toast(
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Signing out...</span>
        </div>,
        { ...toastPresets.loading, duration: Infinity }
      );

      // Refetch to trigger the 401 error and let context clear
      try {
        await queryClient.refetchQueries({ queryKey: ["my-profile"] });
      } catch {
        // Expected to fail with 401
      }

      // Wait a bit for context to update, then redirect
      await new Promise((resolve) => setTimeout(resolve, 200));

      toast.dismiss();
      toast.success("Signed out successfully", { ...toastPresets.success, duration: 2000 });
      router.push("/login");
    },
  });

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (profile.loading) {
    return <div className="bg-muted h-9 w-24 animate-pulse rounded" />;
  }

  if (!isLoggedIn) {
    return (
      <Link href="/login">
        <Button variant="outline">Login</Button>
      </Link>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isDrawerOpen && (
          <div
            className="z-[30]fixed inset-0 duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={cn(
            "fixed top-0 right-0 z-[31] h-[100svh] w-full max-w-[92%] border-l border-gray-200 bg-white shadow-xl sm:max-w-[420px]",
            "transition-transform duration-250 ease-out",
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="mt-1 flex items-center justify-end border-b px-4 py-3">
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                onClick={() => setIsDrawerOpen(false)}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-gray-900">
                  {profile.name?.trim() || profile.email || "User"}
                </h2>
                <p className="mt-1 truncate text-xs text-gray-500">{profile.email}</p>
              </div>

              <Separator className="my-4" />

              {/* Navigation */}
              <nav className="space-y-1">
                <Link href="/dashboard" className="block w-full">
                  <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex gap-2 items-center justify-center">
                      <Newspaper className="h-4 w-4" />
                      <span>Forms</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                </Link>

                <Link href="/forms" className="block w-full">
                  <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex gap-2 items-center justify-center">
                      <Settings className="h-4 w-4" />
                      <span>Automation</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                </Link>

                <Link href="/" className="block w-full">
                  <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                    <div className="flex gap-2 items-center justify-center">
                      <SearchCheck className="h-4 w-4" />
                      <span>Verifier</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                </Link>

                {profile.god && (
                  <>
                    <div className="mt-3 px-3 py-1.5 text-xs font-semibold tracking-wider text-gray-600 uppercase">
                      Admin
                    </div>
                    <Link
                      href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/registry"
                      className="block w-full"
                    >
                      <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                        <span>Registry</span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    </Link>
                    <Link href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor" className="block w-full">
                      <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                        <span>Editor</span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    </Link>
                    <Link href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/fields" className="block w-full">
                      <button className="flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50">
                        <span>Fields</span>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </button>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* Footer pinned to bottom */}
            <div className="mt-auto border-t px-4 py-3">
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-md py-2 font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header with Menu Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          >
            {isDrawerOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </>
    );
  }

  // Desktop Layout
  return (
    <div className="flex w-full justify-between gap-2">
      <div className="flex items-center gap-2">
        {profile.god && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Admin
                <ChevronDown size={14} className="mt-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/registry">Registry</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor">Editor</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/fields">Fields</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-2">
        {profile?.email ? (
          <>
            <Button
              variant="ghost"
              className={cn(
                "w-20 px-2 py-1 flex-col gap-1 h-auto items-center justify-center rounded-[0.33em]",
                pathname === "/dashboard"
                  ? "text-primary"
                  : "opacity-80 hover:opacity-100 hover:bg-gray-100",
              )}
              onClick={() => router.push("/dashboard")}
            >
              <Newspaper className="!h-6 !w-6" strokeWidth={1.7} />
              <span className="text-xs">Forms</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-20 px-2 py-1 flex-col gap-1 h-auto items-center justify-center rounded-[0.33em]",
                pathname === "/forms"
                  ? "text-primary"
                  : "opacity-80 hover:opacity-100 hover:bg-gray-100",
              )}
              onClick={() => router.push("/forms")}
            >
              <Settings className="!h-6 !w-6" strokeWidth={1.7} />
              <span className="text-xs">Automation</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(
                "w-20 px-2 py-1 flex-col gap-1 h-auto items-center justify-center rounded-[0.33em]",
                pathname === "/"
                  ? "text-primary"
                  : "opacity-80 hover:opacity-100 hover:bg-gray-100",
              )}
              onClick={() => router.push("/")}
            >
              <SearchCheck className="!h-6 !w-6" strokeWidth={1.7} />
              <span className="text-xs">Verifier</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  {profile.name?.trim() || profile.email || "User"}
                  <ChevronDown size={14} className="mt-0.5" />
                </Button>
              </DropdownMenuTrigger>  
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
