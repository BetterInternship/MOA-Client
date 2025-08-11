import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { VerificationDetailsCard } from "./VerificationDetailsCard";
import { PdfViewerPanel } from "./PdfViewerPanel";
import type { VerificationResponse } from "@/types/docs";

export function VerificationWithViewer({ result }: { result: VerificationResponse }) {
  if (result.status === "not_found") {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" /> Document Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-700">
          We couldn’t find a document matching the provided serial number. Please check the serial
          and try again. If the issue persists, contact{" "}
          <Link href="mailto:legal@dlsu.edu.ph" className="underline">
            legal@dlsu.edu.ph
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <VerificationDetailsCard result={result} />
      <PdfViewerPanel
        title={result.documentTitle}
        viewUrl={result.viewUrl}
        downloadUrl={result.downloadUrl}
      />
    </div>
  );
}
