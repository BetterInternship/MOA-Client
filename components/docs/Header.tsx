"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getDocsSelf, logoutDocs } from "@/app/api/docs.api";

export default function DocsTopbarUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["docs-self"],
    queryFn: getDocsSelf,
    staleTime: 60_000,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutDocs,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["docs-self"] });
      router.push("/");
    },
  });

  type DocsUser = {
    id: string;
    email: string;
    name?: string;
    coordinatorId?: string;
    isGodMode: boolean;
  };

  const user = data?.profile as DocsUser | undefined;

  if (isLoading) {
    return <div className="bg-muted h-9 w-24 animate-pulse rounded" />;
  }

  return user ? (
    <div className="flex w-full justify-between gap-2">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Button variant="ghost">My Signed Forms</Button>
        </Link>
        {user?.coordinatorId && (
          <Link href="/forms">
            <Button variant="ghost">Forms Preview</Button>
          </Link>
        )}

        {user?.isGodMode && (
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
              {user ? user.name?.trim() || user.email || "User" : "Loading..."}
              <ChevronDown size={14} className="mt-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isLoading}
            >
              {logoutMutation.isLoading ? "Logging out..." : "Logout"}
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
