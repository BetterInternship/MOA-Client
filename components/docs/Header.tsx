// components/docs/DocsTopbarUser.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDocsSelf } from "@/app/api/docs.api";

export default function DocsTopbarUser() {
  const { data, isLoading } = useQuery({
    queryKey: ["docs-self"],
    queryFn: getDocsSelf,
    staleTime: 60_000,
  });

  const user = data?.profile ?? null;

  if (isLoading) {
    return <div className="bg-muted h-9 w-24 animate-pulse rounded" />;
  }

  return user ? (
    <div className="flex w-full justify-between gap-2">
      <div className="">
        <Link href="/dashboard">
          <Button variant="ghost">My Signed Forms</Button>
        </Link>
        <Link href="/forms">
          <Button variant="ghost">Forms Preview</Button>
        </Link>
      </div>
      <Button variant="outline">{user.name ?? "User"}</Button>
    </div>
  ) : (
    <Link href="/login">
      <Button variant="outline">Login</Button>
    </Link>
  );
}
