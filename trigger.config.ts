import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID || "hocker-core",
  runtime: "node",
  logLevel: "info",
  // Tiempo máximo de ejecución para tareas complejas (Ads, Scraping, etc.)
  maxDuration: 300, 
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 2000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
  // Directorio donde Trigger buscará las tareas (el archivo hocker-core.ts que creamos)
  dirs: ["src/trigger"],
});
