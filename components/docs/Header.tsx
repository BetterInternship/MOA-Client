"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  };

  const user = data?.profile as DocsUser | undefined;
  console.log({ user });

  if (isLoading) {
    return <div className="bg-muted h-9 w-24 animate-pulse rounded" />;
  }

  return user ? (
    <div className="flex w-full justify-between gap-2">
      <div>
        <Link href="/dashboard">
          <Button variant="ghost">My Signed Forms</Button>
        </Link>
        {user?.coordinatorId && (
          <Link href="/forms">
            <Button variant="ghost">Forms Preview</Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline">
          {user ? user.name?.trim() || user.email || "User" : "Loading..."}
        </Button>
        <Button
          variant="ghost"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.status === "pending"}
        >
          {logoutMutation.status === "pending" ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  ) : (
    <Link href="/login">
      <Button variant="outline">Login</Button>
    </Link>
  );
}
