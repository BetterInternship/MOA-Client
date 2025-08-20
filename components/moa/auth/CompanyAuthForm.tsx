"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useEffect, useState } from "react";
import { useAuth, usePublicEntityList } from "@/app/api/entity.api";
import { Entity } from "@/types/db";
import { Input } from "@/components/ui/input";

export function CompanyAuthForm() {
  const router = useRouter();
  const [options, setOptions] = useState<{ id: string; name: string }[]>([]);
  const [company, setCompany] = useState<string | null>("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entities = usePublicEntityList();
  const auth = useAuth();

  useEffect(() => {
    setOptions(
      entities.entities?.map((entity: Entity) => ({
        id: entity.id,
        name: entity.legal_identifier ?? "",
      })) ?? []
    );
  }, [entities.entities]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await auth
      .signIn({
        data: {
          legal_entity_name:
            entities.entities.find((e) => e.id === company)?.legal_identifier ?? "",
          password: password,
        },
      })
      .then((r) =>
        r.success
          ? (setLoading(false), router.push("/dashboard"))
          : (setLoading(false), alert("Invalid credentials."))
      )
      .catch((e) => (setLoading(false), console.log(e)));
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="tin">Select Company</Label>
        <Autocomplete
          placeholder="Enter company name..."
          options={options}
          setter={(value) => setCompany(value ?? null)}
        />
        <Input
          type="password"
          placeholder="Enter password..."
          onChange={(e) => setPassword(e.currentTarget.value)}
        ></Input>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button disabled={loading} onClick={(e) => onSubmit}>
        {loading ? "Verifying..." : "Continue"}
      </Button>
    </form>
  );
}
