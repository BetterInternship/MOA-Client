// components/docs/PdfViewerPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { File as FileIcon } from "lucide-react";
import { ExternalLink, Download } from "lucide-react";

export function PdfViewerPanel({
  title,
  viewUrl,
  downloadUrl,
}: {
  title: string;
  viewUrl: string;
  downloadUrl?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-md border bg-white shadow">
      <CardHeader className="">
        <CardTitle className="flex justify-between">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            <span>Official Copy Preview</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 text-sm">
            <Button asChild variant="outline">
              <Link
                href={viewUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in new tab
              </Link>
            </Button>

            {downloadUrl && (
              <Button asChild>
                <Link
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Link>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-[80vh] w-full overflow-hidden rounded border">
          <iframe src={viewUrl} title={title} className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
