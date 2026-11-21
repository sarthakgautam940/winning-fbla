import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { GlyphSprite } from "@/components/Content";
import { JumpDialog } from "@/components/JumpDialog";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SAT Bank", template: "%s | SAT Bank" },
  description: "Every hard SAT question type, mastered five times over.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>
        <GlyphSprite />
        <JumpDialog />
        {children}
      </body>
    </html>
  );
}
