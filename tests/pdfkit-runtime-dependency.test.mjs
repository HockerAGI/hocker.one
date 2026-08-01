import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(
  await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
);

test("PDFKit remains a production dependency with matching declarations", async () => {
  const manifest = await readJson("package.json");
  const lockfile = await readJson("package-lock.json");
  const root = lockfile.packages?.[""];

  assert.equal(manifest.dependencies?.pdfkit, "0.19.1");
  assert.equal(manifest.devDependencies?.pdfkit, undefined);
  assert.equal(manifest.devDependencies?.["@types/pdfkit"], "0.17.6");

  assert.equal(root?.dependencies?.pdfkit, "0.19.1");
  assert.equal(root?.devDependencies?.pdfkit, undefined);
  assert.equal(root?.devDependencies?.["@types/pdfkit"], "0.17.6");
});

test("deprecated jpeg-exif parser is absent from the lockfile", async () => {
  const lockfile = await readJson("package-lock.json");

  assert.equal(lockfile.packages?.["node_modules/jpeg-exif"], undefined);
  assert.equal(lockfile.dependencies?.["jpeg-exif"], undefined);
});

test("audit export still imports PDFKit from the server runtime", async () => {
  const source = await readFile(
    new URL("../src/lib/export-audit.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /import PDFDocument from "pdfkit"/);
  assert.match(source, /new PDFDocument/);
  assert.match(source, /doc\.on\("data"/);
  assert.match(source, /doc\.end\(\)/);
});
