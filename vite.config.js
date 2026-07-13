import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// IMPORTANTE: si tu repo se llama distinto a "nexofit", cambiá esta línea.
// Ejemplo: si el repo es "mi-app-fitness", poné base: "/mi-app-fitness/".
const BASE = "/nexofit/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "NEXO FIT",
        short_name: "NEXO FIT",
        description: "Hábitos, gym y dieta en un solo lugar",
        theme_color: "#2E5BFF",
        background_color: "#F7F8FA",
        display: "standalone",
        orientation: "portrait",
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
});
