import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
        env.VITE_CLERK_PUBLISHABLE_KEY ||
          env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
          "",
      ),
    },
    plugins: [
      tailwindcss(),
      tanstackStart({ server: { entry: "./server.ts" } }),
      solid({ ssr: true }),
      nitro(),
    ],
    server: { port: 3000 },
  };
});
