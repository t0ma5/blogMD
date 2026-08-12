#!/usr/bin/env node
/**
 * Move posts with a future frontmatter `date` out of posts/ so the blog Action
 * does not publish them yet. Safe for CI (ephemeral workspace).
 *
 * Usage: node scripts/hide-scheduled.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = path.join(root, "posts");
const holdDir = path.join(root, ".scheduled-hold");

function quoteUnsafeYamlScalars(frontmatter) {
  return frontmatter.replace(/^([A-Za-z0-9_-]+):\s*(.+)$/gm, (line, key, value) => {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      /^(true|false|null|\d+(\.\d+)?)$/i.test(trimmed)
    ) {
      return line;
    }
    if (/[:#{}[\],&*?|>!%@`]/.test(trimmed)) {
      return `${key}: "${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return line;
  });
}

function parseMatter(raw) {
  const normalized = raw.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (_, fm) => {
    return `---\n${quoteUnsafeYamlScalars(fm)}\n---`;
  });
  return matter(normalized);
}

function startOfTodayUtc() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function isFutureDate(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const postDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return postDay > startOfTodayUtc();
}

if (!fs.existsSync(postsDir)) {
  console.log("No posts/ directory — nothing to do");
  process.exit(0);
}

fs.mkdirSync(holdDir, { recursive: true });

let moved = 0;
for (const name of fs.readdirSync(postsDir)) {
  if (!name.endsWith(".md")) continue;
  const from = path.join(postsDir, name);
  const raw = fs.readFileSync(from, "utf8");
  let data;
  try {
    ({ data } = parseMatter(raw));
  } catch (err) {
    console.warn(`Skip (bad frontmatter): ${name} — ${err.message}`);
    continue;
  }
  if (!isFutureDate(data.date)) continue;
  fs.renameSync(from, path.join(holdDir, name));
  console.log(`Scheduled (hidden until ${data.date}): ${name}`);
  moved += 1;
}

console.log(moved ? `Hid ${moved} future-dated post(s)` : "No future-dated posts to hide");
