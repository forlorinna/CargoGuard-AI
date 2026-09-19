import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CargoGuard · Shipping document intelligence",
  description: "Evidence-backed shipping document verification, discrepancy detection, and human review.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
