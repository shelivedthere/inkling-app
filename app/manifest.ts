import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inkling",
    short_name: "Inkling",
    description: "A playful personal notebook for notes, sketches, and to-dos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#fff8f0",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
