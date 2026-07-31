import { readFile, writeFile } from "node:fs/promises";

const files = [
  new URL("../src/app/api/commands/route.ts", import.meta.url),
  new URL("../src/app/api/commands/approve/route.ts", import.meta.url),
];

for (const file of files) {
  let source = await readFile(file, "utf8");
  source = source.replace('import { tasks } from "@trigger.dev/sdk/v3";\n', "");

  source = source.replace(
    /\n\s*try \{\n\s*await tasks\.trigger\("hocker-core-executor", \{\n\s*commandId: id,\n\s*projectId: ctx\.project_id,\n\s*\}\);\n\s*\} catch \{\n\s*\/\/ el agente físico seguirá haciendo polling\n\s*\}/,
    "\n        // El agente físico consume la cola firmada desde Supabase mediante polling."
  );

  source = source.replace(
    /\n\s*try \{\n\s*await tasks\.trigger\("hocker-core-executor", \{\n\s*commandId: id,\n\s*projectId: ctx\.project_id,\n\s*\}\);\n\s*\} catch \{\n\s*\/\/ fallback al polling del agente físico\n\s*\}/,
    "\n      // El agente físico consume la cola firmada desde Supabase mediante polling."
  );

  if (source.includes("@trigger.dev/sdk") || source.includes("tasks.trigger")) {
    throw new Error(`Trigger SDK removal incomplete: ${file.pathname}`);
  }

  await writeFile(file, source, "utf8");
}

console.log("Trigger SDK removed from Hocker ONE command dispatch paths.");
