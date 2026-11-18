import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { generateKeyPairSync, createVerify } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const moduleRequire = createRequire(import.meta.url);

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
const TEST_TOKEN = "ghs_test_" + "a".repeat(40);

async function runtime(overrides = {}, fetcher = async () => {
  throw new Error("MOCK_FETCH_SHOULD_NOT_RUN");
}) {
  const source = await read("src/lib/github-runtime-identity.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const env = {
    HOCKER_GITHUB_APP_ID: "12345",
    HOCKER_GITHUB_APP_INSTALLATION_ID: "82001510",
    HOCKER_GITHUB_APP_PRIVATE_KEY: pem,
    ...overrides,
  };
  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    module: mod, exports: mod.exports,
    require: moduleRequire,
    process: { env },
    Buffer, Date, AbortSignal, fetch: fetcher,
  });
  return { identity: mod.exports, env };
}

const successResponse = () => ({
  status: 201,
  json: async () => ({
    token: TEST_TOKEN,
    expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    permissions: { contents: "write", pull_requests: "write", metadata: "read" },
  }),
});

test("static PAT is backward compatible and preferred over App with no extra HTTP calls", async () => {
  let calls = 0;
  const { identity } = await runtime({ HOCKER_GITHUB_TOKEN: "ghp_existing_owner_credential" }, async () => {
    calls += 1;
    return successResponse();
  });
  assert.equal(identity.getGitHubRuntimeIdentityKind(), "pat");
  assert.equal(identity.isGitHubRuntimeIdentityConfigured(), true);
  assert.equal(identity.requiresStaticGitHubIdentityForRepositoryCreation(), true);
  assert.equal(await identity.getGitHubRuntimeAccessToken(), "ghp_existing_owner_credential");
  assert.equal(calls, 0);
});

test("App identity mints real signed JWT and narrowed existing-repo installation token", async () => {
  const calls = [];
  const { identity } = await runtime({}, async (url, options) => {
    calls.push({ url, options });
    return successResponse();
  });
  assert.equal(identity.getGitHubRuntimeIdentityKind(), "github_app");
  assert.equal(identity.requiresStaticGitHubIdentityForRepositoryCreation(), false);
  assert.equal(await identity.getGitHubRuntimeAccessToken(), TEST_TOKEN);
  assert.equal(await identity.getGitHubRuntimeAccessToken(), TEST_TOKEN);
  assert.equal(calls.length, 1, "same runtime reuses the short-lived token until refresh");
  const { url, options } = calls[0];
  assert.equal(url, "https://api.github.com/app/installations/82001510/access_tokens");
  assert.equal(options.method, "POST");
  assert.equal(options.cache, "no-store");
  const body = JSON.parse(options.body);
  assert.deepEqual(Array.from(body.repositories), ["hocker.one", "nova.agi", "hocker-node-agent"]);
  assert.deepEqual({ ...body.permissions }, { contents: "write", pull_requests: "write" });
  assert.equal(Object.hasOwn(body.permissions, "administration"), false);
  const token = options.headers.Authorization.slice("Bearer ".length);
  const [header, payload, signature] = token.split(".");
  assert.equal(JSON.parse(Buffer.from(header, "base64url").toString()).alg, "RS256");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
  assert.equal(claims.iss, "12345");
  assert.ok(claims.exp - claims.iat <= 600);
  assert.equal(createVerify("RSA-SHA256").update(header + "." + payload)
    .verify(publicKey, Buffer.from(signature, "base64url")), true);
});

test("invalid, incomplete or unauthorized App config fails closed and never makes provider requests", async () => {
  for (const overrides of [
    { HOCKER_GITHUB_APP_ID: "" },
    { HOCKER_GITHUB_APP_INSTALLATION_ID: "not-a-number" },
    { HOCKER_GITHUB_APP_PRIVATE_KEY: "not-a-private-key" },
    { HOCKER_GITHUB_APP_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\n-----END RSA PRIVATE KEY-----" },
    { HOCKER_GITHUB_APP_REPOSITORIES: "hocker.one,../other" },
    { HOCKER_GITHUB_APP_REPOSITORIES: "hocker.one,hocker.one" },
  ]) {
    let calls = 0;
    const { identity } = await runtime(overrides, async () => {
      calls += 1;
      return successResponse();
    });
    assert.equal(identity.getGitHubRuntimeIdentityKind(), "missing");
    assert.equal(identity.isGitHubRuntimeIdentityConfigured(), false);
    await assert.rejects(() => identity.getGitHubRuntimeAccessToken(), /GITHUB_RUNTIME_IDENTITY_NOT_CONFIGURED/);
    assert.equal(calls, 0);
  }
});

test("GitHub App token is rejected if provider scope, expiry or HTTP status is not verified", async () => {
  const bad = [
    { status: 403, json: async () => ({ error: "secret provider body" }) },
    { status: 201, json: async () => ({ token: TEST_TOKEN, expires_at: new Date(Date.now() + 3600000).toISOString(), permissions: { contents: "read", pull_requests: "write" } }) },
    { status: 201, json: async () => ({ token: TEST_TOKEN, expires_at: new Date(Date.now() + 10000).toISOString(), permissions: { contents: "write", pull_requests: "write" } }) },
  ];
  for (const failed of bad) {
    const { identity } = await runtime({}, async () => failed);
    await assert.rejects(() => identity.getGitHubRuntimeAccessToken(),
      /GITHUB_APP_INSTALLATION_(TOKEN_UNAVAILABLE|PERMISSIONS_NOT_VERIFIED|TOKEN_RESPONSE_INVALID)/);
  }
});

test("credential and repository allowlist changes invalidate cached App access", async () => {
  let calls = 0;
  const { identity, env } = await runtime({}, async () => {
    calls += 1;
    return successResponse();
  });
  await identity.getGitHubRuntimeAccessToken();
  assert.equal(calls, 1);
  env.HOCKER_GITHUB_APP_REPOSITORIES = "nova.agi";
  await identity.getGitHubRuntimeAccessToken();
  assert.equal(calls, 2);
  env.HOCKER_GITHUB_APP_ID = "12346";
  await identity.getGitHubRuntimeAccessToken();
  assert.equal(calls, 3);
});

test("both real GitHub API consumers use async identity without bypassing Owner Gate", async () => {
  const [executor, worker, readiness, materializer, handoff] = await Promise.all([
    read("src/lib/github-runtime-executor.ts"),
    read("src/lib/agi-action-execution.ts"),
    read("src/app/api/agi/runtime/integrations/readiness/route.ts"),
    read("src/lib/nova-application-delivery-materializer.ts"),
    read("src/app/api/context-bridge/chatgpt/handoff-review/route.ts"),
  ]);
  assert.match(executor, /const token = overrideToken \?\? await getGitHubRuntimeAccessToken\(\)/);
  assert.match(worker, /const token = await getGitHubRuntimeAccessToken\(\)/);
  assert.match(worker, /claimApprovedQueueItem/);
  assert.match(materializer, /requiresStaticGitHubIdentityForRepositoryCreation/);
  assert.match(readiness, /productionScope && requiresStaticGitHubIdentityForRepositoryCreation\(\)/);
  assert.match(readiness, /requireOwnerAal2Api\(PROJECT_ID\)/);
  assert.match(handoff, /getGitHubRuntimeAccessToken/);
  assert.doesNotMatch(executor, /getGitHubRuntimeAccessToken\(\).*(POST|PUT|PATCH|DELETE)/);
});


test("canonical AGI catalog uses identical complete identity resolution as GitHub executor", async () => {
  const source = await read("src/lib/agi-runtime-core.ts");
  assert.match(source, /import \{ isGitHubRuntimeIdentityConfigured \} from "@\/lib\/github-runtime-identity"/);
  const github = source.indexOf('tool_key: "github"');
  const vercel = source.indexOf('tool_key: "vercel"', github + 1);
  assert.ok(github > 0 && vercel > github);
  const entry = source.slice(github, vercel);
  assert.match(entry, /required_env: \[\]/);
  assert.match(entry, /GitHub runtime identity/);
  assert.match(entry, /HOCKER_GITHUB_APP_ID/);
  assert.match(entry, /HOCKER_GITHUB_APP_INSTALLATION_ID/);
  assert.match(entry, /HOCKER_GITHUB_APP_PRIVATE_KEY/);
  assert.match(source, /tool\.tool_key === "github"\s*\?\s*isGitHubRuntimeIdentityConfigured\(\)/);
  assert.match(source, /hasCredentials &&\s*tool\.implementation_status === "executor_ready"/);
  assert.match(source, /enabled: Boolean\(tool\?\.execution_enabled && !planned\)/);
});


test("non-RSA keys cannot enable runtime tool identity and RSA strength gate is explicit", async () => {
  const key = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
    .privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const { identity } = await runtime({ HOCKER_GITHUB_APP_PRIVATE_KEY: key });
  assert.equal(identity.getGitHubRuntimeIdentityKind(), "missing");
  assert.equal(identity.isGitHubRuntimeIdentityConfigured(), false);
  await assert.rejects(() => identity.getGitHubRuntimeAccessToken(), /GITHUB_RUNTIME_IDENTITY_NOT_CONFIGURED/);
  const source = await read("src/lib/github-runtime-identity.ts");
  assert.match(source, /key\.asymmetricKeyType !== "rsa"/);
  assert.match(source, /key\.asymmetricKeyDetails\?\.modulusLength \?\? 0\) < 2048/);
});


test("Owner credential guide aligns with GitHub App runtime identity without claiming Production activation", async () => {
  const guide = await read("docs/operations/OWNER_AGI_ENGINEERING_CREDENTIAL_SETUP_2026-11-16.md");
  assert.match(guide, /HOCKER_GITHUB_APP_ID/);
  assert.match(guide, /HOCKER_GITHUB_APP_INSTALLATION_ID/);
  assert.match(guide, /HOCKER_GITHUB_APP_PRIVATE_KEY/);
  assert.match(guide, /PR #460/);
  assert.match(guide, /Owner Gate/);
  assert.doesNotMatch(guide, /ejecutor actual solo soporta token Bearer/);
  assert.match(guide, /todavía no está en Production/);
});


test("new repository bootstrap identifies GitHub User vs Organization owner and rejects wrong token identity", async () => {
  const source = await read("src/lib/github-runtime-executor.ts");
  const ast = ts.createSourceFile("src/lib/github-runtime-executor.ts", source, ts.ScriptTarget.ES2022, true);
  const functionNode = ast.statements.find((node) =>
    ts.isFunctionDeclaration(node) && node.name?.text === "repositoryCreationEndpoint");
  assert.ok(functionNode, "repository creation routing helper missing");
  const js = ts.transpileModule(functionNode.getText(ast), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const make = (type, accountLogin = "HockerAGI", tokenLogin = "HockerAGI") => {
    const calls = [];
    const handler = async (path) => {
      calls.push(path);
      if (path === "/users/HockerAGI") return { type, login: accountLogin };
      if (path === "/user") return { login: tokenLogin };
      throw new Error("Unexpected GitHub API endpoint");
    };
    const fn = vm.runInNewContext(js + "\nrepositoryCreationEndpoint", {
      githubRequest: handler,
      encodeSegment: encodeURIComponent,
    });
    return { fn, calls };
  };

  const personal = make("User");
  assert.equal(await personal.fn("HockerAGI", "creation-only-token"), "/user/repos");
  assert.deepEqual(personal.calls, ["/users/HockerAGI", "/user"]);

  const organization = make("Organization");
  assert.equal(await organization.fn("HockerAGI", "creation-only-token"), "/orgs/HockerAGI/repos");
  assert.deepEqual(organization.calls, ["/users/HockerAGI"]);

  const mismatch = make("User", "HockerAGI", "OtherUser");
  await assert.rejects(() => mismatch.fn("HockerAGI", "creation-only-token"), /GITHUB_REPOSITORY_OWNER_SESSION_MISMATCH/);
  const wrongOwner = make("User", "OtherUser");
  await assert.rejects(() => wrongOwner.fn("HockerAGI", "creation-only-token"), /GITHUB_REPOSITORY_OWNER_TYPE_UNVERIFIED/);
  const unknown = make("Enterprise");
  await assert.rejects(() => unknown.fn("HockerAGI", "creation-only-token"), /GITHUB_REPOSITORY_OWNER_TYPE_UNVERIFIED/);

  assert.match(source, /repositoryCreationEndpoint\(owner, creationToken\)/);
  assert.match(source, /endpoint === "\/user\/repos"/);
  assert.match(source, /requiresStaticGitHubIdentityForRepositoryCreation/);
});


test("dedicated repository-creation token does not override GitHub App writes", async () => {
  const { identity } = await runtime({ HOCKER_GITHUB_REPO_CREATE_TOKEN: "create_owner_token" }, async () => successResponse());
  assert.equal(identity.getGitHubRuntimeIdentityKind(), "github_app");
  assert.equal(identity.getGitHubRepositoryCreationAccessToken(), "create_owner_token");
  assert.equal(identity.requiresStaticGitHubIdentityForRepositoryCreation(), true);
  assert.equal(await identity.getGitHubRuntimeAccessToken(), TEST_TOKEN);
  const old = await runtime({ HOCKER_GITHUB_TOKEN: "existing_static_token", HOCKER_GITHUB_REPO_CREATE_TOKEN: "" });
  assert.equal(old.identity.getGitHubRepositoryCreationAccessToken(), "existing_static_token");
  const missing = await runtime({ HOCKER_GITHUB_APP_ID: "", HOCKER_GITHUB_APP_INSTALLATION_ID: "", HOCKER_GITHUB_APP_PRIVATE_KEY: "", HOCKER_GITHUB_REPO_CREATE_TOKEN: "create_owner_token" });
  assert.equal(missing.identity.getGitHubRuntimeIdentityKind(), "missing");
  assert.equal(missing.identity.requiresStaticGitHubIdentityForRepositoryCreation(), true);
});

test("repository creation API uses a separate static token for all probes and POST", async () => {
  const source = await read("src/lib/github-runtime-executor.ts");
  assert.match(source, /repositoryCreationEndpoint\(owner, creationToken\)/);
  assert.match(source, /githubRequest<\{ login\?: string; type\?: string \}>\([\s\S]*?\{\}, creationToken/);
  assert.match(source, /githubRequest<\{ login\?: string \}>\("\/user", \{\}, creationToken\)/);
  assert.match(source, /creationToken,\s*\);/);
  assert.match(source, /getGitHubRepositoryCreationAccessToken\(\)/);
});


test("App-only model-facing GitHub reads use a canonical authenticated REST bridge", async () => {
  const [registry, bridge, executor, policy, runtime] = await Promise.all([
    read("src/lib/mcp/mcp-registry.ts"),
    read("src/lib/mcp/mcp-github-runtime-read.ts"),
    read("src/lib/github-runtime-executor.ts"),
    read("src/lib/mcp/mcp-policy.ts"),
    read("src/lib/agi-mcp-runtime.ts"),
  ]);
  assert.match(registry, /githubRestIdentity = isGitHubRuntimeIdentityConfigured\(\)/);
  assert.match(registry, /new GitHubRuntimeReadConnector\(\)/);
  assert.match(registry, /entry\.connector instanceof GitHubRuntimeReadConnector/);
  // Verify the security fix: policy receives the exact canonical REST target.
  assert.match(bridge, /assertMcpReadToolPolicy\("github", tool, \{/);
  for (const key of ["owner", "repo", "repository_full_name", "repo_full_name"]) {
    assert.match(bridge, new RegExp(key + ": " + (key === "owner" || key === "repo" ? "String\\(normalized\\." + key + "\\)" : "repository") + "[,\\s]"));
  }
  assert.match(bridge, /repo_full_name: repository,\s*repository,\s*\}\);/);
  assert.match(bridge, /get_file_contents/);
  assert.match(bridge, /list_commits/);
  assert.match(bridge, /get_repository/);
  assert.match(bridge, /executeGitHubReadOperation\("read_file"/);
  assert.match(bridge, /executeGitHubReadOperation\("list_commits"/);
  assert.match(bridge, /executeGitHubReadOperation\("get_repo"/);
  assert.doesNotMatch(bridge, /api\.githubcopilot\.com|create_branch|upsert_file|create_pr/);
  assert.match(executor, /case "list_commits":\s*return listCommits\(input\)/);
  assert.match(policy, /assertMcpReadToolPolicy/);
  assert.match(runtime, /registry\.executeTool\(call\.provider, call\.tool, authorizedArgs\)/);
});


test("App-only REST connector performs authenticated reads and keeps model tools read-only", async () => {
  const source = await read("src/lib/mcp/mcp-github-runtime-read.ts");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const seen = [];
  const policies = [];
  let failProbe = false;
  let probeScope = ["hocker.one", "nova.agi", "hocker-node-agent"];
  const mod = { exports: {} };
  vm.runInNewContext(compiled, {
    module: mod, exports: mod.exports, Date,
    require(id) {
      if (id === "./mcp-policy") return {
        assertMcpReadToolPolicy(provider, tool, args) {
          policies.push({ provider, tool, args });
          if (String(args.path ?? "").endsWith(".env")) throw new Error("MCP_READ_BLOCKED_BY_POLICY");
        },
      };
      if (id === "./mcp-github-read-arguments") return {
        normalizeGitHubListCommitsArguments(args) {
          return { owner: args.owner, repo: args.repo, sha: args.sha ?? "main" };
        },
      };
      if (id === "@/lib/github-runtime-identity") return {
        getGitHubRuntimeReadProbeRepositoryNames() { return probeScope; },
      };
      if (id === "@/lib/github-runtime-executor") return {
        async executeGitHubReadOperation(operation, input) {
          seen.push({ operation, input });
          if (failProbe && operation === "get_repo") throw new Error("AUTH_UNAVAILABLE");
          if (operation === "get_repo") return { repository: input.repository };
          if (operation === "read_file") return { sha: "a".repeat(40), content: "real source from mocked API" };
          if (operation === "list_commits") return { commits: [{ sha: "b".repeat(40) }] };
          if (operation === "list_tree") return { tree: [{ path: "src/index.ts" }] };
          throw new Error("unexpected operation");
        },
      };
      throw new Error("Untrusted module: " + id);
    },
  });
  const Connector = mod.exports.GitHubRuntimeReadConnector;
  const connector = new Connector();
  assert.equal(connector.state.status, "disconnected");
  await assert.rejects(() => connector.executeReadTool("get_repository", { owner: "HockerAGI", repo: "hocker.one" }), /NOT_CONNECTED/);
  const initialized = await connector.initialize();
  assert.equal(connector.state.status, "connected");
  assert.equal(initialized.tools.length, 4);
  assert.equal(seen.filter((row) => row.operation === "get_repo").length, 3);
  assert.equal((await connector.executeReadTool("list_commits", {
    owner: "HockerAGI", repo: "hocker.one", sha: "main",
  })).commits[0].sha, "b".repeat(40));
  assert.equal((await connector.executeReadTool("get_file_contents", {
    owner: "HockerAGI", repo: "hocker.one", path: "src/index.ts", ref: "main",
  })).sha, "a".repeat(40));
  assert.equal((await connector.executeReadTool("list_tree", {
    owner: "HockerAGI", repo: "hocker.one",
  })).tree[0].path, "src/index.ts");
  assert.ok(policies.every((row) => row.provider === "github"));
  assert.ok(policies.every((row) => row.args.repository_full_name === "HockerAGI/hocker.one"));
  // Regression for Codex P1: never validate an allowed alias while fetching
  // another repo. Check all aliases even when the list_commits normalizer
  // would otherwise discard conflicting fields.
  const beforeRejectedReads = seen.length;
  for (const invalid of [
    { owner: "OtherOrg", repo: "private-repo", repo_full_name: "HockerAGI/hocker.one" },
    { owner: "HockerAGI", repo: "hocker.one", repository_full_name: "OtherOrg/private-repo" },
    { owner: "HockerAGI", repo: "hocker.one", repository: "HockerAGI/hocker.one", repo_full_name: "OtherOrg/private-repo" },
    { owner: "HockerAGI", repo: "hocker.one", repository_full_name: "HockerAGI/hocker.one", repository: "OtherOrg/private-repo" },
  ]) {
    await assert.rejects(() => connector.executeReadTool("get_repository", invalid), /GITHUB_RUNTIME_READ_REPOSITORY_CONFLICT/);
    await assert.rejects(() => connector.executeReadTool("list_commits", invalid), /GITHUB_RUNTIME_READ_REPOSITORY_CONFLICT/);
  }
  assert.equal(seen.length, beforeRejectedReads, "unauthorized alias must never reach GitHub REST");
  await assert.rejects(() => connector.executeReadTool("create_pr", {
    owner: "HockerAGI", repo: "hocker.one",
  }), /TOOL_NOT_ALLOWED/);
  await assert.rejects(() => connector.executeReadTool("get_file_contents", {
    owner: "HockerAGI", repo: "hocker.one", path: "src/.env",
  }), /MCP_READ_BLOCKED_BY_POLICY/);
  assert.ok(seen.every((row) => !["create_pr", "upsert_file", "create_branch"].includes(row.operation)));
  failProbe = true;
  const disconnected = new Connector();
  await assert.rejects(() => disconnected.initialize(), /GITHUB_RUNTIME_AUTHENTICATED_READ_FAILED/);
  assert.equal(disconnected.state.status, "error");

  // Codex P2: a repository-scoped App is usable without access to siblings.
  failProbe = false;
  probeScope = ["hocker.one"];
  const beforeNarrowed = seen.length;
  const narrowed = new Connector();
  await narrowed.initialize();
  assert.equal(narrowed.state.status, "connected");
  assert.deepEqual(seen.slice(beforeNarrowed).map((row) => row.input.repository), ["HockerAGI/hocker.one"]);
  probeScope = ["unrelated-private-repo"];
  const denied = new Connector();
  await assert.rejects(() => denied.initialize(), /GITHUB_RUNTIME_AUTHENTICATED_READ_FAILED/);
  assert.equal(denied.state.status, "error");
});

test("engineering native discovery includes both commit and file SHA reads", async () => {
  const runtime = await read("src/lib/agi-mcp-runtime.ts");
  const tools = runtime.slice(runtime.indexOf("const preferredEngineeringTools = ["));
  assert.match(tools, /"get_repository",[\s\S]*?"list_commits",[\s\S]*?"list_tree",[\s\S]*?"get_file_contents"/);
});


test("GitHub App readiness uses only the configured installation repository subset", async () => {
  const { identity } = await runtime({ HOCKER_GITHUB_APP_REPOSITORIES: "hocker.one" });
  assert.deepEqual(Array.from(identity.getGitHubRuntimeReadProbeRepositoryNames()), ["hocker.one"]);
  assert.equal(identity.getGitHubRuntimeIdentityKind(), "github_app");
  const defaultScope = await runtime();
  assert.deepEqual(Array.from(defaultScope.identity.getGitHubRuntimeReadProbeRepositoryNames()), [
    "hocker.one", "nova.agi", "hocker-node-agent",
  ]);
  const disabled = await runtime({ HOCKER_GITHUB_APP_ID: "", HOCKER_GITHUB_REPO_CREATE_TOKEN: "creation_only" });
  assert.deepEqual(Array.from(disabled.identity.getGitHubRuntimeReadProbeRepositoryNames()), []);
  const legacy = await runtime({ GITHUB_TOKEN: "pat_owner_scoped" });
  assert.deepEqual(Array.from(legacy.identity.getGitHubRuntimeReadProbeRepositoryNames()), [
    "hocker.one", "nova.agi", "hocker-node-agent",
  ]);
});
