---
title: "⚙️ How this blog works"
date: 2026-08-02
---

This site is a deliberately simple markdown blog. There is no CMS, no database, and no fancy framework — just files in a GitHub repository and a GitHub Action that turns them into pages.

## The idea

Write a post as a `.md` file, push it, and the site updates. That is the whole workflow.

Under the hood it uses a mod of [github-pages-blog-action](https://github.com/nilbuild/github-pages-blog-action): on every push to `main`/`master`, the Action builds HTML from markdown and deploys it to the `gh-pages` branch.

## What lives in the repo

- **`posts/`** — published articles (this one included); future `date` values stay hidden until that day
- **`drafts/`** — unfinished posts that never go live
- **`about.md`** — the about page
- **`site.json`** — title, SEO, and social links
- **`static/`** — anything that should appear at the site root (images, CSS, extra HTML)

Each post starts with a short frontmatter block:

```md
---
title: "How this blog works"
date: 2026-08-11
---
```

The `date` is both the display/sort date and the **publish gate**: if it’s in the future (UTC), a pre-deploy step pulls that file out of `posts/` for the build so the Action never sees it yet. A daily cron redeploys around midnight UTC so scheduled posts go live without a manual push. Put half-finished work in `drafts/` instead — those are never published.

## Local preview

Before pushing, you can build and view the site locally:

```bash
npm install
npm run preview
```

Use `npm run preview:drafts` for drafts, `npm run preview:scheduled` for future-dated posts, or `npm run preview:all` for both.

## Theme

The Action ships its own HTML layout. This repo overrides the look with a custom dark theme in `static/css/theme.css`, which replaces the Action’s CSS on deploy.

## Why keep it this simple

I wanted markdown in, website out — nothing more. No Hugo install, no theme submodule, no build pipeline to babysit beyond GitHub Actions. When the urge to over-engineer shows up, the answer is still: add another `.md` file and push.
