import { readFile, writeFile } from "node:fs/promises";

const runtimePath = "src/lib/serverless-agi-runtime.ts";
const testPath = "tests/serverless-agi-runtime.test.mjs";

let runtime = await readFile(runtimePath, "utf8");
let tests = await readFile(testPath, "utf8");

const modelHelper = `function gatewayModel(): string {
  return env("AI_GATEWAY_MODEL_AUTO", "AI_GATEWAY_MODEL_FAST") || "google/gemini-2.5-flash";
}
`;

const credentialHelper = `${modelHelper}
type GatewayCredential = {
  source: "oidc" | "api_key";
  token: string;
};

function gatewayCredentials(): GatewayCredential[] {
  const oidcToken = env("VERCEL_OIDC_TOKEN");
  const apiKey = env("AI_GATEWAY_API_KEY");
  const credentials: GatewayCredential[] = [];

  // Vercel injects OIDC automatically for deployments. Prefer it so an old or
  // mistyped manual key cannot shadow the deployment identity.
  if (oidcToken) credentials.push({ source: "oidc", token: oidcToken });
  if (apiKey && apiKey !== oidcToken) credentials.push({ source: "api_key", token: apiKey });
  return credentials;
}
`;

if (!runtime.includes("function gatewayCredentials(): GatewayCredential[]")) {
  if (!runtime.includes(modelHelper)) throw new Error("gatewayModel marker not found");
  runtime = runtime.replace(modelHelper, credentialHelper);
}

runtime = runtime.replace(
  `export function serverlessGatewayConfigured(): boolean {
  return Boolean(env("AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"));
}`,
  `export function serverlessGatewayConfigured(): boolean {
  return gatewayCredentials().length > 0;
}`,
);

const functionStart = runtime.indexOf("export async function callServerlessAgiModel(args: {");
const functionEnd = runtime.indexOf("\nfunction taskPrompt(task: AgiTask): string {");
if (functionStart < 0 || functionEnd < 0 || functionEnd <= functionStart) {
  throw new Error("callServerlessAgiModel boundaries not found");
}

const replacement = `export async function callServerlessAgiModel(args: {
  profile: AgiProfile;
  prompt: string;
  timeout_ms?: number;
}): Promise<ModelCompletion> {
  const credentials = gatewayCredentials();
  if (!credentials.length) throw new Error("AI_GATEWAY_AUTH_NOT_CONFIGURED");

  const model = gatewayModel();
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(5_000, Math.min(args.timeout_ms ?? 40_000, 45_000)),
  );
  const requestBody = JSON.stringify({
    model,
    messages: [
      { role: "system", content: profilePrompt(args.profile) },
      { role: "user", content: args.prompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    stream: false,
  });

  try {
    let lastAuthError = "AI_GATEWAY_AUTH_FAILED";

    for (const [index, credential] of credentials.entries()) {
      const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${credential.token}\`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
        body: requestBody,
      });

      const payload = (await response.json().catch(() => ({}))) as GatewayResponse;
      if (!response.ok) {
        const message = payload.error?.message || \`AI_GATEWAY_HTTP_\${response.status}\`;
        const authenticationRejected = response.status === 401 || response.status === 403;
        const hasFallback = index < credentials.length - 1;
        if (authenticationRejected && hasFallback) {
          lastAuthError = message;
          continue;
        }
        throw new Error(message);
      }

      const text = String(payload.choices?.[0]?.message?.content ?? "").trim();
      if (!text) throw new Error("AI_GATEWAY_EMPTY_RESPONSE");

      return {
        provider: "vercel-ai-gateway",
        model,
        text,
        usage: {
          tokens_in: payload.usage?.prompt_tokens ?? null,
          tokens_out: payload.usage?.completion_tokens ?? null,
          total_tokens: payload.usage?.total_tokens ?? null,
        },
      };
    }

    throw new Error(lastAuthError);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("AI_GATEWAY_TIMEOUT");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
`;

runtime = runtime.slice(0, functionStart) + replacement + runtime.slice(functionEnd);

const authTest = `test("serverless gateway prefers Vercel OIDC and falls back only on authentication rejection", async () => {
  const runtime = await read("src/lib/serverless-agi-runtime.ts");
  const oidcPosition = runtime.indexOf('const oidcToken = env("VERCEL_OIDC_TOKEN")');
  const apiKeyPosition = runtime.indexOf('const apiKey = env("AI_GATEWAY_API_KEY")');

  assert.ok(oidcPosition >= 0);
  assert.ok(apiKeyPosition > oidcPosition);
  assert.match(runtime, /gatewayCredentials\(\)\.length > 0/);
  assert.match(runtime, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(runtime, /authenticationRejected && hasFallback/);
  assert.match(runtime, /continue;/);
});

`;

if (!tests.includes('test("serverless gateway prefers Vercel OIDC')) {
  const marker = 'test("chat fallback authenticates membership and reserves execution budget"';
  const markerIndex = tests.indexOf(marker);
  if (markerIndex < 0) throw new Error("test insertion marker not found");
  tests = tests.slice(0, markerIndex) + authTest + tests.slice(markerIndex);
}

await writeFile(runtimePath, runtime);
await writeFile(testPath, tests);
