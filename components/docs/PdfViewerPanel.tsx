// components/docs/PdfViewerPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { File as FileIcon } from "lucide-react";

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          <span>Official Copy Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-[80vh] w-full overflow-hidden rounded border">
          <iframe
            src={viewUrl}
            title={title}
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Button asChild variant="outline">
            <Link href={viewUrl} target="_blank" rel="noopener">
              Open in new tab
            </Link>
          </Button>
          {downloadUrl && (
            <Button asChild variant="ghost">
              <Link href={downloadUrl} target="_blank" rel="noopener">
                Download PDF
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
