import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://januscore.pro"),
  title: {
    default: "JanusCore Technologies | AI Engineering, Automatización & Software B2B",
    template: "%s | JanusCore Technologies",
  },
  description:
    "Estudio de ingeniería de inteligencia artificial, automatización de operaciones críticas y catálogo de software B2B listo para producción (JanusCore Pro, DentiApp Online, Kattxo SRI, Tenddy Shop).",
  keywords: [
    "JanusCore",
    "JanusCore Pro",
    "Ingeniería de Inteligencia Artificial",
    "AI Engineering",
    "Automatización de procesos empresariales",
    "Agentes de IA",
    "Model Context Protocol",
    "MCP",
    "Verificación financiera de transferencias",
    "Auditoría antifraude de comprobantes",
    "Validación de transferencias bancarias",
    "DentiApp Online",
    "Software odontológico Formulario 033 MSP",
    "Kattxo",
    "Descarga masiva comprobantes SRI XML",
    "Automatización contable Ecuador",
    "Tenddy Shop",
    "E-commerce B2B cotizaciones",
    "Verificación antifraude de comprobantes",
    "Supabase Row Level Security",
  ],
  authors: [{ name: "JanusCore Technologies", url: "https://januscore.pro" }],
  creator: "JanusCore Technologies",
  publisher: "JanusCore Technologies",
  applicationName: "JanusCore Technologies",
  alternates: {
    canonical: "https://januscore.pro",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://januscore.pro",
    title: "JanusCore Technologies | AI Engineering, Automatización & Software B2B",
    description:
      "Estudio de ingeniería de IA, automatización de operaciones críticas y suite de productos de software B2B listos para producción y licenciamiento.",
    siteName: "JanusCore Technologies",
  },
  twitter: {
    card: "summary_large_image",
    title: "JanusCore Technologies | AI Engineering & Software B2B",
    description:
      "Ingeniería de Inteligencia Artificial aplicada y software B2B para operaciones críticas.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
