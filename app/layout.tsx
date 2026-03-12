import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Global styles

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ProspectAI - Prospecção Inteligente B2B",
  description:
    "Ferramenta de prospecção de leads para profissionais de IA usando Google Places e Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
