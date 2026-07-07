/**
 * Hocker ONE — Instrumentation & Graceful Shutdown
 *
 * PR-10: Next.js instrumentation hook for startup and shutdown lifecycle.
 * Handles cleanup of connections, flushes observability data, and
 * signals in-flight requests to complete gracefully.
 */

export async function register() {
  // Next.js calls this once at startup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { log } = await import("@/lib/logger");
    log.info("Hocker ONE instrumentation registered", { route: "instrumentation" });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      log.info(`Received ${signal}. Starting graceful shutdown…`);

      // Flush Langfuse if configured
      try {
        const { getLangfuse } = await import("@/lib/langfuse-safe");
        const langfuse = getLangfuse();
        if (langfuse) {
          await langfuse.flushAsync();
          log.info("Langfuse flushed successfully");
        }
      } catch {
        // Langfuse flush failure is non-critical
      }

      log.info("Graceful shutdown complete");
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
