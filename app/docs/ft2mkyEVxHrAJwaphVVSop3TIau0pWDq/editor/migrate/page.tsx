"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  migrateFormMetadata,
  isFormMetadataV0,
  isFormMetadataV1,
  OldIFormMetadata,
  IFormMetadata,
} from "@betterinternship/core/forms";

interface MigrationResult {
  name: string;
  status: "success" | "error" | "skipped";
  message: string;
  v0?: OldIFormMetadata;
  v1?: IFormMetadata;
}

/**
 * Form metadata migration page
 * Allows users to test and perform migrations from v0 to v1
 */
export default function FormMetadataMigrationPage() {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  const handleMigrateSingle = () => {
    if (!jsonInput.trim()) {
      alert("Please paste a form metadata JSON");
      return;
    }

    setIsProcessing(true);
    const results: MigrationResult[] = [];

    try {
      const formData = JSON.parse(jsonInput) as OldIFormMetadata;

      if (!isFormMetadataV0(formData)) {
        results.push({
          name: formData.name || "Unknown",
          status: "error",
          message:
            "Form is not v0 schema. Expected schema_version: 0, required_parties, and signatories arrays.",
        });
      } else {
        try {
          const migratedForm = migrateFormMetadata(formData, {
            partyIdStrategy: "name",
            accountIdStrategy: "email-hash",
          });

          if (!isFormMetadataV1(migratedForm)) {
            throw new Error("Migration produced invalid v1 schema");
          }

          results.push({
            name: formData.name,
            status: "success",
            message: `Successfully migrated ${migratedForm.schema.blocks.length} blocks with ${migratedForm.signing_parties.length} signing parties`,
            v0: formData,
            v1: migratedForm,
          });
        } catch (error) {
          results.push({
            name: formData.name || "Unknown",
            status: "error",
            message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
    } catch (error) {
      results.push({
        name: "Unknown",
        status: "error",
        message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    setMigrationResults(results);
    setIsProcessing(false);
    setShowOutput(true);
  };

  const handleDownloadMigrated = (result: MigrationResult) => {
    if (!result.v1) return;

    const dataStr = JSON.stringify(result.v1, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.name}.v1.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMigrated = (result: MigrationResult) => {
    if (!result.v1) return;
    navigator.clipboard.writeText(JSON.stringify(result.v1, null, 2));
    alert("Migrated JSON copied to clipboard!");
  };

  const successCount = migrationResults.filter((r) => r.status === "success").length;
  const errorCount = migrationResults.filter((r) => r.status === "error").length;

  return (
    <div className="min-h-screen w-full bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Form Metadata Migration</h1>
          <p className="text-muted-foreground">
            Migrate form metadata from schema v0 to v1. The new schema uses a block-based structure
            with embedded signing parties.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>1. Paste Form Metadata (v0)</CardTitle>
              <CardDescription>
                Paste the complete old form metadata JSON from your database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"name": "form-name", "schema_version": 0, "schema": [...], "required_parties": [...], "signatories": [...], ...}'
                className="h-64 w-full rounded-md border border-slate-300 bg-white p-4 font-mono text-sm"
              />
              <Button
                onClick={handleMigrateSingle}
                disabled={isProcessing || !jsonInput.trim()}
                className="w-full"
              >
                {isProcessing ? <Loader>Migrating...</Loader> : "Migrate Form"}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {showOutput && migrationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Migration Results</CardTitle>
                <CardDescription>
                  {successCount} successful, {errorCount} failed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {migrationResults.map((result, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${
                        result.status === "success"
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{result.name}</h3>
                          <Badge type={result.status === "success" ? "default" : "destructive"}>
                            {result.status === "success" ? "✓ Success" : "✗ Failed"}
                          </Badge>
                        </div>
                      </div>
                      <p
                        className={`text-sm ${
                          result.status === "success" ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {result.message}
                      </p>

                      {result.status === "success" && result.v1 && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyMigrated(result)}
                          >
                            Copy JSON
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadMigrated(result)}
                          >
                            Download JSON
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowOutput(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      )}

                      {/* Show v1 structure details */}
                      {result.status === "success" && result.v1 && (
                        <div className="mt-4 border-t border-green-200 pt-4">
                          <p className="mb-2 text-xs font-semibold text-green-900">
                            Schema Structure:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-semibold">Blocks:</span>{" "}
                              {result.v1.schema.blocks.length}
                            </div>
                            <div>
                              <span className="font-semibold">Signing Parties:</span>{" "}
                              {result.v1.signing_parties.length}
                            </div>
                            <div>
                              <span className="font-semibold">Subscribers:</span>{" "}
                              {result.v1.subscribers.length}
                            </div>
                            <div>
                              <span className="font-semibold">Schema Version:</span> v
                              {result.v1.schema_version}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
