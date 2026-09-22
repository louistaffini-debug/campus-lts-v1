import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus LTS — Pilotage pédagogique",
  description: "Création de quiz et suivi des apprenants pour les parcours du Campus LTS.",
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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
