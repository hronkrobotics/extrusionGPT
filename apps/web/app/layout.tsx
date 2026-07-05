import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExtrusionGPT",
  description:
    "Natural language to manufacturable modular aluminum extrusion designs. MVP: parametric workbench generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full">{children}</body>
    </html>
  );
}
