# blogMD

Simple markdown blog: write a post, push, it’s live on GitHub Pages.

## Features

- Markdown posts with frontmatter (`title`, `date`, optional `permalink`)
- Quoted frontmatter titles (safe with `:` and `?`)
- Kebab-case post filenames
- **Scheduled posts** — future `date` values stay unpublished until that day
- `about.md` about page
- `site.json` for title, SEO, social links, and site URL
- `static/` assets copied to the site root (including `static/images/`)
- Custom dark **Amber Charcoal** theme (`static/css/theme.css`)
- Styled `404` page
- Favicon (`favicon.svg` / `favicon.png`)
- Open Graph / Twitter share image (`og.png`)
- Drafts in `drafts/` (not published)
- Local preview with **auto-rebuild** on file changes
- Deploy via `kamranahmedse/github-pages-blog-action@v0.0.10`
- Deploy on push to `main`/`master`, or manual **workflow_dispatch**

## Write a post

Add a kebab-case file under `posts/`:

```md
---
title: "My post title: with a colon"
date: 2026-08-12
---

Your content here.
```

Push to `main`/`master` — GitHub Actions publishes to `gh-pages`.

## Images

Put images in `static/images/`. Everything under `static/` is copied to the site root, so a file at:

```text
static/images/diagram.png
```

is available at:

```text
https://your-site/images/diagram.png
```

Link from markdown like this:

```md
![Diagram of the build flow](/images/diagram.png)
```

Or as a plain link:

```md
[Download the diagram](/images/diagram.png)
```

Prefer kebab-case filenames (`my-screenshot.png`) and keep paths root-absolute (`/images/...`) so they work from both the homepage and post pages.

## Drafts

Put unfinished posts in `drafts/` (not `posts/`). They are ignored on deploy.

## Scheduled posts

The Action itself publishes every markdown file in `posts/`. This repo adds a pre-deploy step that **hides posts whose frontmatter `date` is in the future** (UTC calendar day), so you can schedule by dating ahead:

```md
---
title: "Ship notes"
date: 2026-09-01
---
```

- Stays in `posts/` in git (easy to edit anytime)
- Skipped on deploy until that date
- Reappears automatically on the next deploy on/after that day

Trigger a deploy on the publish day (push anything, run the workflow manually, or wait for the daily midnight-UTC cron). Preview also hides future posts unless you opt in.

## Local preview

```bash
npm install
npm run preview            # published posts only (no drafts, no future dates)
npm run preview:drafts     # include drafts/
npm run preview:scheduled  # include future-dated posts
npm run preview:all        # drafts + scheduled
```

Opens at http://localhost:4173 and rebuilds when you edit posts, drafts, theme, or `site.json`.

## Manual deploy

Actions → **Build and Deploy** → **Run workflow**

---

Built with [github-pages-blog-action](https://github.com/nilbuild/github-pages-blog-action). Credit: [nilbuild](https://github.com/nilbuild).
