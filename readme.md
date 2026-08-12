# blogMD

Super simple markdown blog: write a post, push, it’s live on GitHub Pages. Read more on the [LIVE BLOG](https://t0ma5.github.io/how-this-blog-works.html).

Built with my fork [`github-pages-blog-action`](https://github.com/t0ma5/github-pages-blog-action).

## Features

- Markdown posts with frontmatter (`title`, `date`, optional `permalink`, `draft`, `description`)
- **Scheduled posts** — future `date` values stay unpublished until that UTC day (built into the Action)
- **Drafts** — `draft: true`, `_filename.md`, or files in `drafts/`
- Tolerant `site.json` (comments + trailing commas)
- GFM-friendly markdown (tables, task lists, strikethrough)
- Kebab-case post filenames
- `about.md` about page
- `site.json` for title, SEO, social links, site URL, favicon, OG image
- `static/` assets at the site root (including `static/images/`)
- Amber dark theme with reading zoom (+/−) and Share
- Favicon + Open Graph / Twitter cards + canonical URLs + `sitemap.xml`
- Local preview with auto-rebuild
- Deploy on push, manual **workflow_dispatch**, or daily midnight-UTC cron

## Write a post

Add a kebab-case file under `posts/`:

```md
---
title: "My post title: with a colon"
date: 2026-08-12
description: "Optional excerpt for SEO/social"
---

Your content here.
```

Push to `main`/`master` — GitHub Actions publishes to `gh-pages`.

## Drafts

Unfinished work:

- put files in `drafts/`, or
- keep them in `posts/` with `draft: true`, or
- name them `_like-this.md`

None of those are published.

## Scheduled posts

Set a future `date` in frontmatter:

```md
---
title: "Ship notes"
date: 2026-09-01
---
```

The Action skips it until that UTC calendar day. A daily cron redeploy picks it up automatically. Local preview hides future posts unless you opt in.

## Images

Put images in `static/images/`. A file at `static/images/diagram.png` is served as `/images/diagram.png`:

```md
![Diagram of the build flow](/images/diagram.png)
```

## Local preview

```bash
npm install
npm run preview            # published posts only
npm run preview:drafts     # include drafts/
npm run preview:scheduled  # include future-dated posts
npm run preview:all        # drafts + scheduled
```

Opens at http://localhost:4173.

## GitHub Pages

Live site: **https://t0ma5.github.io/**

The content repo is named `t0ma5.github.io` (GitHub’s user-site convention). The Action deploys to the `gh-pages` branch; Pages serves that branch at the root URL.

Settings: **Settings → Pages → Deploy from a branch → `gh-pages` / `/`**

---

Action fork: [t0ma5/github-pages-blog-action](https://github.com/t0ma5/github-pages-blog-action) · upstream credit: [nilbuild](https://github.com/nilbuild/github-pages-blog-action).
