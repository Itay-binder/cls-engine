import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CLS Engine",
  description: "AI-powered Growth Operating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
