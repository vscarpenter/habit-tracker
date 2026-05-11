#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const versionModulePath = path.join(rootDir, "src/lib/version.ts");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function bumpPatch(version) {
  const parts = version.split(".");
  if (parts.length !== 3 || parts.some((part) => !/^\d+$/.test(part))) {
    throw new Error(`Unsupported semver version: ${version}`);
  }

  const [major, minor, patch] = parts.map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function writeVersionModule(version) {
  const content =
    `export const APP_VERSION = "${version}";\n\n` +
    `export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE ?? null;\n`;
  fs.writeFileSync(versionModulePath, content);
}

const packageJson = readJson(packageJsonPath);
const nextVersion = bumpPatch(packageJson.version);

packageJson.version = nextVersion;
writeJson(packageJsonPath, packageJson);

if (fs.existsSync(packageLockPath)) {
  const packageLock = readJson(packageLockPath);
  packageLock.version = nextVersion;
  if (packageLock.packages?.[""]) {
    packageLock.packages[""].version = nextVersion;
  }
  writeJson(packageLockPath, packageLock);
}

writeVersionModule(nextVersion);

process.stdout.write(`${nextVersion}\n`);
