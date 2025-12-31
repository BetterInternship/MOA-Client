"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { logoutSignatory } from "@/app/api/docs.api";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";

export default function DocsTopbarUser() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const profile = useSignatoryProfile();

  const logoutMutation = useMutation({
    mutationFn: logoutSignatory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      router.push("/login");
    },
  });

  if (profile.loading) {
    return <div className="bg-muted h-9 w-24 animate-pulse rounded" />;
  }

  return profile ? (
    <div className="flex w-full justify-between gap-2">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost">My Signed Forms</Button>
        </Link>
        <Link href="/forms">
          <Button variant="ghost">
            {profile.coordinatorId ? "Forms Preview" : "My Saved Templates"}{" "}
          </Button>
        </Link>

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              {profile.name?.trim() || profile.email ? "User" : "Loading..."}
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
      </div>
    </div>
  ) : (
    <Link href="/login">
      <Button variant="outline">Login</Button>
    </Link>
  );
}
