import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";

const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

// Evita consulta externa ao iniciar o servidor local de desenvolvimento.
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";

/**
 * Configuração do Vite para uma aplicação com index.html na raiz e backend
 * executado em Cloudflare Worker.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  plugins: [
    react(),
    cloudflare({
      persistState: { path: ".wrangler/state" },
      inspectorPort: false,
      config: {
        main: "./worker.ts",
        compatibility_date: "2026-05-22",
        compatibility_flags: ["nodejs_compat"],
        d1_databases: hostingConfig.d1
          ? [
              {
                binding: hostingConfig.d1,
                database_name: "elegancia-pet-local",
                database_id: PLACEHOLDER_DATABASE_ID,
              },
            ]
          : [],
        r2_buckets: hostingConfig.r2
          ? [
              {
                binding: hostingConfig.r2,
                bucket_name: "elegancia-pet-imagens-local",
              },
            ]
          : [],
        assets: {
          binding: "ASSETS",
          not_found_handling: "single-page-application",
          run_worker_first: ["/api/*"],
        },
      },
    }),
  ],
});
