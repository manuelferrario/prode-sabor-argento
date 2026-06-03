import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prode Sabor Argento — Mundial 2026",
  description: "Predecí los resultados del Mundial 2026 y ganá premios increíbles con Sabor Argento.",
  openGraph: {
    title: "Prode Sabor Argento — Mundial 2026",
    description: "Predecí los resultados del Mundial 2026 y ganá premios increíbles.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
