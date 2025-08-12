import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import APIQueryProvider from "./providers/api-query-provider";

export const metadata: Metadata = {
  title: "MOA Management Platform",
  description: "Manage company MOAs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <APIQueryProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </APIQueryProvider>
  );
}
