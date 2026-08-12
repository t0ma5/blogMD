#!/usr/bin/env node
/**
 * Patch generated gh-pages HTML: inject site.js, favicon, and Open Graph tags.
 * Usage: node scripts/patch-pages.mjs <site-dir> <site-url>
 */
import fs from "node:fs";
import path from "node:path";

const siteDir = path.resolve(process.argv[2] || ".");
const siteUrl = String(process.argv[3] || "").replace(/\/$/, "");

if (!siteUrl) {
  console.error("Usage: node scripts/patch-pages.mjs <site-dir> <site-url>");
  process.exit(1);
}

const headSnippet = [
  `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`,
  `<link rel="alternate icon" href="/favicon.png">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:image" content="${siteUrl}/og.png">`,
  `<meta name="twitter:card" content="summary_large_image">`,
  `<meta name="twitter:image" content="${siteUrl}/og.png">`,
].join("\n  ");

const bodySnippet = `<script src="/js/site.js"></script>`;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === ".git") continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, files);
    else if (name.name.endsWith(".html")) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(siteDir)) {
  let html = fs.readFileSync(file, "utf8");
  let next = html;

  if (!next.includes('rel="icon"')) {
    next = next.replace(/<\/head>/i, `  ${headSnippet}\n</head>`);
  }

  if (!next.includes("js/site.js")) {
    next = next.replace(/<\/body>/i, `  ${bodySnippet}\n</body>`);
  }

  if (!next.includes('property="og:title"')) {
    const titleMatch = next.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "blogMD";
    const descMatch = next.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const desc = descMatch ? descMatch[1] : "";
    const ogTitle = [
      `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}">`,
      `<meta property="og:description" content="${desc.replace(/"/g, "&quot;")}">`,
      `<meta name="twitter:title" content="${title.replace(/"/g, "&quot;")}">`,
      `<meta name="twitter:description" content="${desc.replace(/"/g, "&quot;")}">`,
    ].join("\n  ");
    next = next.replace(/<\/head>/i, `  ${ogTitle}\n</head>`);
  }

  if (next !== html) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}

console.log(`Patched ${changed} HTML file(s) in ${siteDir}`);
