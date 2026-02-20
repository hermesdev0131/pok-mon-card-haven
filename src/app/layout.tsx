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
  title: "GradedBR — Marketplace de Cartas Pokémon Graduadas",
  description:
    "Compre e venda cartas Pokémon graduadas (PSA, BGS, CGC) com pagamento protegido, vendedores verificados e histórico real de preços.",
  openGraph: {
    title: "GradedBR — Cartas Pokémon Graduadas",
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
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <Providers>
          {/* Global background gradient blobs */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="blob blob-accent w-[600px] h-[600px] -top-[200px] -left-[200px] animate-float" />
            <div className="blob blob-purple w-[500px] h-[500px] top-1/3 -right-[150px] animate-float-slow" />
            <div className="blob blob-cyan w-[400px] h-[400px] bottom-0 left-1/4 animate-float" />
          </div>
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
