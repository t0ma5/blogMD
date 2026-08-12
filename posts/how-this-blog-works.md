---
title: "⚙️ How this blog works"
date: 2026-08-02
---

This site is a deliberately simple markdown blog. There is no CMS, no database, and no fancy framework — just files in a GitHub repository and a GitHub Action that turns them into pages.

## The idea

Write a post as a `.md` file, push it, and the site updates. That is the whole workflow.

Under the hood it uses my fork of [github-pages-blog-action](https://github.com/t0ma5/github-pages-blog-action) (`v0.1.0`): on every push to `main`/`master`, the Action builds HTML from markdown and deploys it to the `gh-pages` branch.

## What lives in the repo

- **`posts/`** — articles; future `date` or `draft: true` stay unpublished
- **`drafts/`** — unfinished posts that never go live
- **`about.md`** — the about page
- **`site.json`** — title, SEO, social links, site URL, favicon, OG image
- **`static/`** — files copied to the site root (theme overrides, images, favicon, `og.png`)

Each post starts with frontmatter:

```md
---
title: "How this blog works"
date: 2026-08-11
description: "Optional excerpt for SEO/social"
---
```

The `date` is both the display/sort date and the **publish gate**: if it’s in the future (UTC), the Action skips that file. A daily cron redeploys around midnight UTC so scheduled posts go live without a manual push. Use `draft: true` or the `drafts/` folder for unfinished work.

## Local preview

```bash
npm install
npm run preview
```

Use `npm run preview:drafts`, `npm run preview:scheduled`, or `npm run preview:all` when you need those.

## Theme

The Action ships an amber dark theme (date under title, zoom controls, Share). This repo can still override CSS/JS via `static/css/theme.css` and `static/js/site.js` because static files are copied last.

## Why keep it this simple

Markdown in, website out — nothing more. When the urge to over-engineer shows up, the answer is still: add another `.md` file and push.
