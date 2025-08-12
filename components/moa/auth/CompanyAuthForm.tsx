"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useEffect, useState } from "react";
import { useAuthApi } from "@/app/api/entity.api";
import { useEntities } from "@/app/api/school.api";
import { Entity } from "@/types/db";

export function CompanyAuthForm() {
  const router = useRouter();
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [company, setCompany] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e = useEntities();
  const auth = useAuthApi();

  useEffect(() => {
    setOptions(e.entities.map((entity: Entity) => ({ id: entity.id, name: entity.display_name })));
  }, [e.entities]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await auth.signIn({
      data: {
        legal_entity_name: "",
        password: "",
      },
    });

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="tin">Company TIN</Label>
        <Autocomplete
          value={company}
          placeholder="Enter company name..."
          options={options}
          setter={(value) => setCompany(value ?? null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button disabled={loading} onClick={(e) => onSubmit}>
        {loading ? "Verifying..." : "Continue"}
      </Button>
    </form>
  );
}
