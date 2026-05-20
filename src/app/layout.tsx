import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: "Graduada — Marketplace de Cartas Pokémon Graduadas",
  description:
    "Compre e venda cartas Pokémon graduadas (PSA, BGS, CGC) com pagamento protegido, vendedores verificados e histórico real de preços.",
  openGraph: {
    title: "Graduada — Cartas Pokémon Graduadas",
    description:
      "Marketplace brasileiro de cartas Pokémon graduadas com confiança real.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preload slab background images so they paint together with the card
            images on the marketplace grid, instead of appearing a moment later. */}
        <link rel="preload" as="image" href="/slabs/nacional.png" />
        <link rel="preload" as="image" href="/slabs/internacional.png" />
        <link rel="preload" as="image" href="/slabs/misto.png" />
      </head>
      <body className={`${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-screen flex-col relative">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
