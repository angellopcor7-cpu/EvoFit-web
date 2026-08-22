import type { MetadataRoute } from "next";

// Convención especial de Next.js App Router: esto genera /manifest.webmanifest
// automáticamente y Next agrega el <link rel="manifest"> al <head> solo. Es
// lo que el navegador usa al "Agregar a pantalla de inicio" — sin esto no
// sabía qué ícono usar y mostraba uno genérico/en blanco.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EvoFit",
    short_name: "EvoFit",
    description: "Entrena. Progresa. No falles.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0d",
    theme_color: "#0a0a0d",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
