import { Langfuse } from "langfuse-node";

type TraceLike = {
  update: (payload?: unknown) => void;
  event: (payload?: unknown) => void;
};

type LangfuseLike = {
  trace: (payload?: unknown) => TraceLike;
  flushAsync: () => Promise<void>;
};

const noopTrace: TraceLike = {
  update() {},
  event() {},
};

const noopClient: LangfuseLike = {
  trace() {
    return noopTrace;
  },
  async flushAsync() {},
};

let cached: LangfuseLike | null = null;

export function getLangfuse(): LangfuseLike {
  if (cached) return cached;

  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  const baseUrl = process.env.LANGFUSE_BASE_URL?.trim() || "https://cloud.langfuse.com";

  if (!publicKey || !secretKey) {
    cached = noopClient;
    return cached;
  }

  try {
    const client = new Langfuse({
      publicKey,
      secretKey,
      baseUrl,
    });

    cached = client as unknown as LangfuseLike;
    return cached;
  } catch {
    cached = noopClient;
    return cached;
  }
}
