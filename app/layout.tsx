import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CLS Engine",
    template: "%s | CLS Engine",
  },
  description: "AI-powered Growth Operating System — scale smarter, not harder.",
  keywords: ["CLS Engine", "growth", "ads", "AI", "marketing"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
