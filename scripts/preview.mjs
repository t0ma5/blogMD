import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "_preview");
const includeDrafts = process.argv.includes("--drafts");
const includeScheduled = process.argv.includes("--scheduled");
const port = Number(process.env.PORT || 4173);
const watchDirs = ["posts", "drafts", "static", "about.md", "site.json"].map((p) =>
  path.join(root, p)
);

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

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
    if (/[:#{}[\],&*?|>!%@`]/.test(trimmed) || trimmed.includes(" #")) {
      return `${key}: "${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return line;
  });
}

function parseMatter(raw, fileLabel) {
  const normalized = raw.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (_, fm) => {
    return `---\n${quoteUnsafeYamlScalars(fm)}\n---`;
  });
  try {
    return matter(normalized);
  } catch (err) {
    console.error(`Frontmatter error in ${fileLabel}: ${err.message}`);
    console.error('Tip: quote titles that contain ":" — title: "My title: subtitle"');
    throw err;
  }
}

function readSiteConfig() {
  return JSON.parse(fs.readFileSync(path.join(root, "site.json"), "utf8"));
}

function siteOrigin(siteConfig) {
  if (siteConfig.url) return String(siteConfig.url).replace(/\/$/, "");
  if (siteConfig.cname) return `https://${String(siteConfig.cname).replace(/\/$/, "")}`;
  return "";
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

function loadPosts() {
  const dirs = [path.join(root, "posts")];
  if (includeDrafts) dirs.push(path.join(root, "drafts"));

  const posts = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      const filePath = path.join(dir, name);
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = parseMatter(raw, path.relative(root, filePath));
      const scheduled = isFutureDate(data.date);
      if (scheduled && !includeScheduled) continue;

      const title = data.title || path.basename(name, ".md");
      const permalink = (data.permalink || `/${slugify(title)}`).replace(/\/$/, "");
      posts.push({
        title,
        date: formatDate(data.date),
        sortDate: data.date ? new Date(data.date) : new Date(0),
        permalink,
        html: marked.parse(content),
        draft: dir.endsWith("drafts"),
        scheduled,
        description: String(content)
          .replace(/[#>*_`\[\]]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160),
      });
    }
  }

  posts.sort((a, b) => b.sortDate - a.sortDate);
  return posts;
}

function layout({ siteConfig, title, description, body, pathName = "/" }) {
  const origin = siteOrigin(siteConfig);
  const desc = description || siteConfig.seo?.description || "";
  const canonical = origin ? `${origin}${pathName}` : pathName;
  const ogImage = origin ? `${origin}/og.png` : "/og.png";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="color-scheme" content="dark">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate icon" href="/favicon.png">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">
  <link rel="stylesheet" href="/css/theme.css">
</head>
<body id="top">
  <nav class="nav">
    <div class="nav__left">
      <a href="/">Home</a>
      <a href="/about.html">About</a>
    </div>
    <div class="nav__center"></div>
    <div class="nav__right"></div>
  </nav>
  ${body}
  <footer>
    <a href="#top">Back to Top</a>
  </footer>
  <script src="/js/site.js"></script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyStatic() {
  const staticDir = path.join(root, "static");
  if (!fs.existsSync(staticDir)) return;
  fs.cpSync(staticDir, outDir, { recursive: true });
}

function writeHome(siteConfig, posts) {
  const byYear = new Map();
  for (const post of posts) {
    const year = String(post.sortDate.getFullYear() || "Undated");
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(post);
  }

  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));
  let list = `
    <header class="intro">
      <h1 class="intro__head">${escapeHtml(siteConfig.title)}</h1>
      <p class="intro__sub">${escapeHtml(siteConfig.subtitle || "")}</p>
    </header>
  `;

  for (const year of years) {
    list += `<h2 class="section__title">${escapeHtml(year)}</h2>`;
    for (const post of byYear.get(year)) {
      const badge = [
        post.draft ? "draft" : "",
        post.scheduled ? "scheduled" : "",
      ]
        .filter(Boolean)
        .join(", ");
      const badgeText = badge ? ` (${badge})` : "";
      list += `
        <a class="post" href="${escapeHtml(post.permalink)}.html">
          <span class="post__title">${escapeHtml(post.title)}${badgeText}</span>
          <span class="post__date">${escapeHtml(post.date)}</span>
        </a>
      `;
    }
  }

  if (!posts.length) {
    list += `<p>No posts yet. Add a markdown file under <code>posts/</code>.</p>`;
  }

  fs.writeFileSync(
    path.join(outDir, "index.html"),
    layout({
      siteConfig,
      title: siteConfig.seo?.title || siteConfig.title,
      description: siteConfig.seo?.description,
      body: list,
      pathName: "/",
    })
  );
}

function writePosts(siteConfig, posts) {
  for (const post of posts) {
    const body = `
      <article>
        <h1>${escapeHtml(post.title)}</h1>
        <time>${escapeHtml(post.date)}</time>
        ${post.html}
      </article>
    `;
    const rel = `${post.permalink.replace(/^\//, "")}.html`;
    const file = path.join(outDir, rel);
    ensureDir(path.dirname(file));
    fs.writeFileSync(
      file,
      layout({
        siteConfig,
        title: post.title,
        description: post.description,
        body,
        pathName: `/${rel}`,
      })
    );
  }
}

function writeAbout(siteConfig) {
  const aboutPath = path.join(root, "about.md");
  const md = fs.existsSync(aboutPath) ? fs.readFileSync(aboutPath, "utf8") : "";
  const body = `<div class="about"><div class="about__content">${marked.parse(md)}</div></div>`;
  fs.writeFileSync(
    path.join(outDir, "about.html"),
    layout({
      siteConfig,
      title: `About · ${siteConfig.title}`,
      description: siteConfig.seo?.description,
      body,
      pathName: "/about.html",
    })
  );
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
}

function build() {
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureDir(outDir);
  const siteConfig = readSiteConfig();
  const posts = loadPosts();
  copyStatic();
  writeHome(siteConfig, posts);
  writePosts(siteConfig, posts);
  writeAbout(siteConfig);
  console.log(`Built ${posts.length} post(s) → _preview/`);
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let filePath = path.join(outDir, urlPath === "/" ? "index.html" : urlPath);
    if (!filePath.startsWith(outDir)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`Preview ready at http://localhost:${port}`);
    if (includeDrafts) console.log("Including drafts/");
    if (includeScheduled) console.log("Including scheduled (future-dated) posts/");
    console.log("Watching for changes…");
  });
}

function watchAndRebuild() {
  let timer = null;
  const rebuild = (reason) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        console.log(`\nChange detected (${reason}) — rebuilding…`);
        build();
      } catch (err) {
        console.error("Rebuild failed:", err.message);
      }
    }, 150);
  };

  for (const target of watchDirs) {
    if (!fs.existsSync(target)) continue;
    fs.watch(target, { recursive: true }, (_event, filename) => {
      rebuild(filename || path.basename(target));
    });
  }
}

build();
startServer();
watchAndRebuild();
