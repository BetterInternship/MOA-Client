import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import ApiQueryProvider from "./providers/api-query-provider";

export const metadata: Metadata = {
  title: "MOA Management Platform",
  description: "Manage company MOAs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApiQueryProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js"></script>
        </head>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ApiQueryProvider>
  );
}
