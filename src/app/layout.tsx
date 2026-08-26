import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvoFit",
  description: "Entrena. Progresa. No falles.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EvoFit",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          // Se ejecuta antes de pintar para evitar el "flash" del tema
          // incorrecto: aplica el tema guardado (o el del sistema) al
          // <html> antes de que React hidrate.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('evofit-theme');var resolved=(t==='light'||t==='dark')?t:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.theme=resolved;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
