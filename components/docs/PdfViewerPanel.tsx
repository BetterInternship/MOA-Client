// components/docs/PdfViewerPanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { File as FileIcon, Loader2 } from "lucide-react";
import { ExternalLink, Download } from "lucide-react";
import { useState } from "react";

export function PdfViewerPanel({
  title,
  viewUrl,
  downloadUrl,
}: {
  title: string;
  viewUrl: string;
  downloadUrl?: string;
}) {
  const [loading, setLoading] = useState(false);
  async function downloadPdf(url: string, filename: string = "document.pdf") {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob(); // get file data
      const blobUrl = URL.createObjectURL(blob); // create local URL

      const a = document.createElement("a"); // create anchor
      a.href = blobUrl;
      a.download = (filename || url.split("/").pop()) ?? ""; // default name
      document.body.appendChild(a);
      a.click(); // trigger download

      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl); // clean up
    } catch (err) {
      console.error("Download failed:", err);
    }
    setLoading(false);
  }

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
            {downloadUrl && (
              <Button disabled={loading} onClick={() => void downloadPdf(viewUrl, `${title}.pdf`)}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
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
