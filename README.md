# Temporal Tides

The documentation site for the **Temporal Tides** world bible.

📖 **The canonical world bible lives at [temporaltides.com](https://temporaltides.com/).**
All world, story, character, and lore content is published there — this repository
holds the source Markdown and the tooling that builds and deploys the site. Story
details are intentionally **not** duplicated in this README; read them on the site.

This document covers only the technical side: how the docs are generated, how to run
the site locally, and how to contribute changes.

---

## What's in this repo

- **`WorldBible/`** — the source Markdown for the site (the single source of truth for content).
- **`.vitepress/`** — [VitePress](https://vitepress.dev/) site config, theme, and the manually maintained sidebar.
- **`public/`** — static assets (images, portraits, favicon, logo).
- **`scripts/`** — helper scripts for running, building, and link-checking.
- **`docs/`** — internal design specs and historical reports (not published to the site).
- **`deprecated/`** — previous iterations kept for reference (excluded from the build).

Project guidance for contributors and coding agents lives in
[`AGENTS.md`](AGENTS.md) (with [`CLAUDE.md`](CLAUDE.md) pointing to it).

---

## How the site is built

The site is a [VitePress](https://vitepress.dev/) project that builds **directly from the
repo root** — there is no content sync step. Key details are configured in
[`.vitepress/config.js`](.vitepress/config.js):

- `srcDir` is `./`, so Markdown anywhere in the repo can become a page.
- `srcExclude` keeps internal-only directories (`deprecated/`, `scripts/`, `docs/superpowers/`,
  `AGENTS.md`, `CLAUDE.md`, etc.) out of the public site.
- The **sidebar is maintained by hand** — a new page won't appear in navigation until you
  add a sidebar entry in `config.js`.
- `base` is `/` when building on Vercel and `/TemporalTides/` otherwise (e.g. GitHub Pages),
  detected via the `VERCEL` environment variable.
- `ignoreDeadLinks` is `true`, so a successful build does **not** guarantee link integrity —
  see [Link checking](#link-checking) below.

### Deployment

The production site ([temporaltides.com](https://temporaltides.com/)) is deployed on
**Vercel**. The build is configured in [`vercel.json`](vercel.json):

| Setting | Value |
|---|---|
| Install command | `npm install` |
| Build command | `npm run docs:build` |
| Output directory | `.vitepress/dist` |

Assets under `/assets/` are served with a long-lived immutable cache header.

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) (any recent LTS release) and npm.

### Setup

```bash
git clone https://github.com/shaiss/TemporalTides.git
cd TemporalTides
npm install
```

### Running the dev server

```bash
npm run docs:dev        # Dev server with hot reload at http://localhost:5173
```

Then open **http://localhost:5173**. Press `/` to search, and use the moon icon to toggle
dark mode. The convenience script `scripts/RUN_VITEPRESS.sh` wraps this command.

### Available scripts

| Command | Description |
|---|---|
| `npm run docs:dev` | Start the dev server with hot reload (port 5173). |
| `npm run docs:build` | Build the static site into `.vitepress/dist`. |
| `npm run docs:preview` | Preview the production build locally. |
| `npm run docs:serve` | Serve the built site on port 4173. |
| `npm test` | Alias that runs `docs:build` — "testing" here means the build succeeds. |

### Helper scripts

| Script | Purpose |
|---|---|
| `scripts/RUN_VITEPRESS.sh` | Launch the dev server. |
| `scripts/build-and-check.sh` | Build the site and report the output size. |
| `scripts/check-links.sh` | Report broken relative `.md` links in `WorldBible/`. |

### Link checking

Because the VitePress build ignores dead links (`ignoreDeadLinks: true`), a green build can
still hide broken internal links. Run the link checker to catch them:

```bash
scripts/check-links.sh
```

It reports broken relative `.md` links found in `WorldBible/`. Report any **new** broken
links you introduce in your pull request description.

---

## Contributing

All content changes go through a branch and pull request — **never commit directly to `main`.**

1. **Create a branch** off `main`:
   ```bash
   git checkout -b your-descriptive-branch-name
   ```
2. **Make your changes.** If you add a new page, remember to add its **sidebar entry** in
   [`.vitepress/config.js`](.vitepress/config.js).
3. **Verify the build passes** and check for broken links:
   ```bash
   npm run docs:build
   scripts/check-links.sh
   ```
4. **Push and open a pull request** against `main`:
   ```bash
   git push -u origin your-descriptive-branch-name
   ```
   Note any new broken links in the PR description. Pull requests are reviewed and merged by
   the maintainer.

For content conventions, terminology rules, and representation guidelines, see
[`AGENTS.md`](AGENTS.md) and the files it references.

---

## License

ISC. See [`package.json`](package.json).
