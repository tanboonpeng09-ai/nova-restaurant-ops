import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shared/app-shell";

export const metadata: Metadata = {
  title: "NOVA STEAKHOUSE Operations",
  description: "Premium restaurant QR ordering and operations system demo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
