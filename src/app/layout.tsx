import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Winning FBLA", template: "%s | Winning FBLA" },
  description: "A private study app for the FBLA Data Science & AI event.",
  robots: { index: false, follow: false },
  applicationName: "Winning FBLA",
};

export const viewport: Viewport = {
  themeColor: "#f6f4ef",
};

// Resolves the saved theme before first paint so pages never flash. Light unless dark was chosen.
const themeScript = `(function(){try{var s=localStorage.getItem("wf-theme");document.documentElement.dataset.theme=s==="dark"?"dark":"light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
