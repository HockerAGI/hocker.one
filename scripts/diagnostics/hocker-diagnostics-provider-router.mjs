#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VERSION = "12.7L-2C-B";
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "_");
const outRoot = process.env.OUT_ROOT || (existsSync("/sdcard/Download") ? "/sdcard/Download" : process.cwd());
const outDir = join(outRoot, `HOCKER_127L2CB_DIAGNOSTICS_${stamp}`);
const baseUrl = (process.env.PROD_BASE || process.env.BASE_URL || "https://hockerone.vercel.app").replace(/\/$/, "");
const routes = (process.env.DIAGNOSTIC_ROUTES || "/,/one,/ecosistema,/soluciones,/seguridad")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, "local_lighthouse"), { recursive: true });
mkdirSync(join(outDir, "pagespeed"), { recursive: true });
mkdirSync(join(outDir, "github_actions"), { recursive: true });
mkdirSync(join(outDir, "fallback"), { recursive: true });

const attempts = [];

function sh(command) {
  return spawnSync("bash", ["-lc", command], { encoding: "utf8" });
}

function writeJson(name, payload) {
  writeFileSync(join(outDir, name), JSON.stringify(payload, null, 2));
}

function logAttempt(attempt) {
  attempts.push({ ...attempt, checked_at: new Date().toISOString() });
  writeJson("diagnostics_attempts.json", attempts);
}

function findChrome() {
  const direct = [
    process.env.CHROME_PATH,
    process.env.GOOGLE_CHROME_BIN,
    process.env.CHROMIUM_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean);

  for (const candidate of direct) {
    if (candidate && existsSync(candidate)) return candidate;
  }

  const found = sh("command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true");
  return found.stdout.trim().split(/\n/).filter(Boolean)[0] || "";
}

function countLighthouseReports() {
  const root = join(outDir, "local_lighthouse");
  let count = 0;
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) walk(path);
      if (name.isFile() && path.endsWith(".json")) {
        try {
          const data = JSON.parse(readFileSync(path, "utf8"));
          if (data.lighthouseVersion && data.categories) count += 1;
        } catch {}
      }
    }
  };
  walk(root);
  return count;
}

async function tryLocalLighthouse() {
  const chrome = findChrome();

  if (!chrome) {
    throw new Error("Chrome/Chromium no encontrado para Lighthouse local.");
  }

  const smoke = spawnSync(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--dump-dom",
    `${baseUrl}/one`,
  ], { encoding: "utf8", timeout: 60000 });

  writeFileSync(join(outDir, "local_lighthouse", "chrome_smoke.stdout.log"), smoke.stdout || "");
  writeFileSync(join(outDir, "local_lighthouse", "chrome_smoke.stderr.log"), smoke.stderr || "");

  if (smoke.status !== 0) {
    throw new Error(`Chrome smoke falló con exit_code=${smoke.status}`);
  }

  for (const route of routes.slice(0, 5)) {
    const safe = route === "/" ? "home" : route.replace(/^\//, "").replace(/[^\w.-]+/g, "_");
    const output = join(outDir, "local_lighthouse", safe);
    const run = sh(`CHROME_PATH=${JSON.stringify(chrome)} npx --yes lighthouse ${JSON.stringify(`${baseUrl}${route}`)} --chrome-flags="--headless=new --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu" --output=json --output=html --output-path=${JSON.stringify(output)} --quiet`);
    writeFileSync(`${output}.stdout.log`, run.stdout || "");
    writeFileSync(`${output}.stderr.log`, run.stderr || "");
  }

  const reports = countLighthouseReports();
  if (reports < 1) {
    throw new Error("Lighthouse local no generó reportes JSON válidos.");
  }

  return { ok: true, provider: "local_lighthouse", reports };
}

async function tryPageSpeed() {
  const results = [];
  const apiKey = process.env.PAGESPEED_API_KEY || "";

  for (const route of routes.slice(0, 5)) {
    const url = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    url.searchParams.set("url", `${baseUrl}${route}`);
    url.searchParams.set("strategy", "mobile");
    for (const category of ["performance", "accessibility", "best-practices", "seo", "pwa"]) {
      url.searchParams.append("category", category);
    }
    if (apiKey) url.searchParams.set("key", apiKey);

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const safe = route === "/" ? "home" : route.replace(/^\//, "").replace(/[^\w.-]+/g, "_");
    writeFileSync(join(outDir, "pagespeed", `${safe}.json`), text);

    results.push({ route, status: res.status, ok: res.ok });

    if (res.status === 429) {
      throw new Error("PageSpeed bloqueado por cuota 429.");
    }
  }

  const okCount = results.filter((item) => item.ok).length;
  if (okCount < 1) {
    throw new Error("PageSpeed no generó resultados válidos.");
  }

  return { ok: true, provider: "pagespeed_insights", okCount, results };
}

function gitRepoFromOrigin() {
  const origin = sh("git remote get-url origin 2>/dev/null || true").stdout.trim();
  const https = origin.match(/github\.com[:/](.+?\/.+?)(?:\.git)?$/);
  return https ? https[1].replace(/\.git$/, "") : (process.env.GITHUB_REPOSITORY || "");
}

async function tryGitHubActions() {
  if (process.env.HOCKER_DIAGNOSTICS_SKIP_GITHUB === "1") {
    throw new Error("GitHub Actions dispatch omitido por HOCKER_DIAGNOSTICS_SKIP_GITHUB=1.");
  }

  const token = process.env.HOCKER_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  const repo = process.env.HOCKER_GITHUB_REPO || gitRepoFromOrigin();
  const ref = process.env.GITHUB_REF_NAME || sh("git rev-parse --abbrev-ref HEAD").stdout.trim() || "main";

  if (!token || !repo) {
    throw new Error("GitHub Actions no configurado: falta token o repo.");
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/hocker-lighthouse-diagnostics.yml/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref,
      inputs: {
        base_url: baseUrl,
        diagnostic_routes: routes.join(","),
      },
    }),
  });

  const body = await res.text();
  writeFileSync(join(outDir, "github_actions", "dispatch_response.txt"), body || `HTTP ${res.status}`);

  if (res.status !== 204) {
    throw new Error(`GitHub Actions dispatch falló HTTP ${res.status}. Si el workflow aún no está en main, esto es esperado antes del merge.`);
  }

  return { ok: true, provider: "github_actions_lighthouse", status: "queued", repo, ref };
}

function documentedFallback() {
  const payload = {
    ok: false,
    provider: "documented_fallback",
    version: VERSION,
    base_url: baseUrl,
    routes,
    stable_ready: false,
    reason: "Todos los proveedores ejecutables fallaron o no están disponibles. Esto NO equivale a Lighthouse OK.",
    attempts,
    next_attempt: "Ejecutar local con Chrome estable, PageSpeed sin cuota 429 o GitHub Actions una vez que el workflow exista en main.",
  };

  writeJson("fallback/documented_fallback.json", payload);
  writeFileSync(join(outDir, "fallback", "DOCUMENTED_FALLBACK.md"), [
    `# HOCKER ${VERSION} · Documented fallback`,
    "",
    `Base URL: ${baseUrl}`,
    "",
    "## Resultado",
    "- Lighthouse/PWA no queda aprobado por fallback.",
    "- Fase 13 sigue bloqueada si no existe evidencia real.",
    "",
    "## Intentos",
    ...attempts.map((attempt) => `- ${attempt.provider}: ${attempt.ok ? "OK" : "FAIL"} — ${attempt.error || attempt.reason || ""}`),
    "",
  ].join("\n"));

  return payload;
}

async function main() {
  const providerOrder = [
    ["local_lighthouse", tryLocalLighthouse],
    ["pagespeed_insights", tryPageSpeed],
    ["github_actions_lighthouse", tryGitHubActions],
  ];

  for (const [provider, fn] of providerOrder) {
    try {
      const result = await fn();
      logAttempt({ provider, ok: true, result });
      writeJson("diagnostics_summary.json", {
        ok: true,
        version: VERSION,
        selected_provider: provider,
        result,
        out_dir: outDir,
        stable_ready: provider !== "github_actions_lighthouse",
        note: provider === "github_actions_lighthouse"
          ? "GitHub Actions fue encolado; descargar artifact para cerrar evidencia."
          : "Proveedor diagnóstico generó evidencia local.",
      });
      console.log(`OK: diagnostics provider selected: ${provider}`);
      console.log(`OUT_DIR: ${outDir}`);
      return;
    } catch (error) {
      logAttempt({
        provider,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.log(`WARN: ${provider} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const fallback = documentedFallback();
  writeJson("diagnostics_summary.json", {
    ...fallback,
    out_dir: outDir,
  });
  console.log("WARN: documented fallback generated. This is not a Lighthouse pass.");
  console.log(`OUT_DIR: ${outDir}`);
}

main().catch((error) => {
  writeJson("diagnostics_summary.json", {
    ok: false,
    version: VERSION,
    selected_provider: "fatal_error",
    error: error instanceof Error ? error.message : String(error),
    out_dir: outDir,
    stable_ready: false,
  });
  console.error(error);
  process.exitCode = 1;
});
