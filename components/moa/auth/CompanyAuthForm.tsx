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
    <form className="mt-4 grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-1">
        <Label className="text-muted-foreground text-xs font-normal">Select Company</Label>
        <Autocomplete
          placeholder="Legal company name..."
          options={options}
          setter={(value) => setCompany(value ?? null)}
        />
        <div className="h-1"></div>
        <Label className="text-muted-foreground text-xs font-normal">Enter password</Label>
        <Input
          type="password"
          placeholder="Password..."
          onChange={(e) => setPassword(e.currentTarget.value)}
        ></Input>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button disabled={loading} onClick={(e) => onSubmit}>
        {loading ? "Verifying..." : "Login"}
      </Button>
    </form>
  );
}
