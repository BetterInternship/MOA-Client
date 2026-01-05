"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { formsControllerSyncFormsToProd } from "@/app/api";

interface SyncResult {
  formId: string;
  formName: string;
  devVersion: number;
  prodVersionBefore: number | null;
  prodVersionAfter: number;
  status: "synced" | "error";
  message: string;
}

interface SyncResponse {
  success: boolean;
  totalForms: number;
  successCount: number;
  failureCount: number;
  completedAt: string;
  results: SyncResult[];
}

export default function DocsPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSync = async () => {
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await formsControllerSyncFormsToProd();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Data Synchronization</h1>
          <p className="text-slate-600">
            Synchronize and update template registry across environments
          </p>
        </div>

        {/* Warning Card */}
        <div className="mb-8 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
            <div>
              <h2 className="mb-1 font-semibold text-amber-900">
                Caution: This Operation Will Update System Data
              </h2>
              <p className="mb-2 text-sm text-amber-800">
                This process will synchronize and update template versions across your registry.
                Ensure you have a backup before proceeding.
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                <li>All template versions will be incremented</li>
                <li>Associated documents will be synchronized</li>
                <li>This operation cannot be easily undone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Control Section */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="space-y-6">
            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600"
                disabled={loading}
              />
              <label htmlFor="confirm" className="cursor-pointer text-slate-700 select-none">
                I understand this will update the system and have verified all prerequisites
              </label>
            </div>

            {/* Action Button */}
            <button
              onClick={handleSync}
              disabled={!confirmed || loading}
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all duration-200 ${
                !confirmed || loading
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing... This may take a moment
                </>
              ) : (
                "Proceed with Synchronization"
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-lg border-l-4 border-red-400 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="mb-1 font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {response && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <p className="mb-1 text-sm text-slate-600">Total Items</p>
                <p className="text-3xl font-bold text-slate-900">{response.totalForms}</p>
              </div>
              <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-6 shadow">
                <p className="mb-1 text-sm text-green-700">Successful</p>
                <p className="text-3xl font-bold text-green-600">{response.successCount}</p>
              </div>
              <div
                className={`rounded-lg border-l-4 p-6 shadow ${
                  response.failureCount === 0
                    ? "border-slate-500 bg-slate-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <p
                  className={`mb-1 text-sm ${
                    response.failureCount === 0 ? "text-slate-600" : "text-red-700"
                  }`}
                >
                  Failed
                </p>
                <p
                  className={`text-3xl font-bold ${
                    response.failureCount === 0 ? "text-slate-900" : "text-red-600"
                  }`}
                >
                  {response.failureCount}
                </p>
              </div>
            </div>

            {/* Success Message */}
            {response.success && (
              <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Synchronization Complete</h3>
                    <p className="mt-1 text-sm text-green-800">
                      All items have been successfully processed. Completed at{" "}
                      {new Date(response.completedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Results Table */}
            {response.results.length > 0 && (
              <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">Synchronization Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                          Version Update
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                          Message
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {response.results.map((result, idx) => (
                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">
                            {result.formName}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {result.prodVersionBefore !== null
                              ? `${result.prodVersionBefore} → ${result.prodVersionAfter}`
                              : `New → ${result.prodVersionAfter}`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {result.status === "synced" ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">Synced</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">Failed</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{result.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
