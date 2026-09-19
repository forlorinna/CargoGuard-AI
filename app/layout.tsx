import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CargoGuard | Shipping Document Verification",
  description: "Evidence-backed shipping document verification for the Averis × Monash Hackathon 2026",
  applicationName: "CargoGuard",
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
