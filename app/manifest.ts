import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Odette: Small routines, softer days",
    short_name: "Odette",
    description:
      "A little space for your daily rituals. Build gentle routines and watch yourself grow.",
    start_url: "/",
    display: "standalone",
    background_color: "#fefdfd",
    theme_color: "#fefdfd",
    icons: [
      {
        src: "/favicon/favicon-mobile-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/favicon-mobile-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon/favicon-mobile-full-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/favicon-mobile-full-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
