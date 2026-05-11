import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Engineering Tool",
  description: "Layer 1 — Transform raw ideas into self-commanding prompt packages",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
