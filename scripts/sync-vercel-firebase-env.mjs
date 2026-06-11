#!/usr/bin/env node
/**
 * Push Firebase env vars from .env.local to Vercel (Production + Preview).
 *
 * Prerequisites:
 *   1. Copy .env.local.example → .env.local and fill FIREBASE_PRIVATE_KEY
 *   2. npx vercel login
 *   3. npx vercel link   (once, from repo root)
 *
 * Usage: npm run sync:vercel-firebase
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const FIREBASE_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

function loadEnvFile(filePath) {
  const env = {};
  if (!existsSync(filePath)) {
    return env;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, "\n");
    env[key] = value;
  }

  return env;
}

function runVercel(args) {
  const result = spawnSync("npx", ["vercel", ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function isVercelLinked() {
  const vercelDir = resolve(root, ".vercel");
  return (
    existsSync(resolve(vercelDir, "project.json")) ||
    existsSync(resolve(vercelDir, "repo.json"))
  );
}

function ensureVercelReady() {
  const whoami = spawnSync("npx", ["vercel", "whoami"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (whoami.status !== 0) {
    console.error("Not logged in to Vercel. Run: npx vercel login");
    process.exit(1);
  }

  if (!isVercelLinked()) {
    console.error("Project not linked. Run from repo root: npx vercel link");
    process.exit(1);
  }

  console.log(`Vercel account: ${whoami.stdout.trim()}`);
}

const env = loadEnvFile(envPath);

if (!existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.local.example and add your Firebase values.");
  process.exit(1);
}

const missing = FIREBASE_VARS.filter((name) => {
  if (name === "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID") return false;
  const value = env[name];
  return typeof value !== "string" || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error("Missing required values in .env.local:");
  for (const name of missing) {
    console.error(`  - ${name}`);
  }
  console.error("\nGenerate FIREBASE_PRIVATE_KEY from Firebase Console → Service Accounts.");
  process.exit(1);
}

ensureVercelReady();

const TARGETS = ["production", "preview"];

console.log("\nSyncing Firebase environment variables to Vercel (production + preview)...\n");

for (const name of FIREBASE_VARS) {
  const value = env[name]?.trim();
  if (!value) {
    console.log(`Skipping optional ${name} (not set).`);
    continue;
  }

  for (const target of TARGETS) {
    console.log(`→ ${name} (${target})`);
    runVercel(["env", "add", name, target, "--value", value, "--yes", "--force"]);
  }
}

console.log("\nDone. Redeploy for changes to take effect:");
console.log("  npx vercel --prod");
console.log("\nThen verify: GET https://<your-domain>/api/health");
