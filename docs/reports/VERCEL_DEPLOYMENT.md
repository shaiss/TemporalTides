# Deploy Temporal Tides to Vercel

## Overview

Your Temporal Tides site (landing page + docs) is configured to deploy to both **GitHub Pages** and **Vercel**. Pushing to `main` automatically deploys to both platforms.

---

## Vercel Setup (One-Time)

### 1. Connect Your Repository

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub)
2. Click **Add New** → **Project**
3. Import your **TemporalTides** repository from GitHub
4. Vercel will auto-detect the configuration from `vercel.json`

### 2. Verify Build Settings

Vercel should auto-fill these from `vercel.json`:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other |
| **Build Command** | `npm run docs:build` |
| **Output Directory** | `.vitepress/dist` |
| **Install Command** | `npm install` |

### 3. Deploy

Click **Deploy**. The first build will run automatically.

---

## Automatic Deployments

Every push to `main` triggers:

- **Vercel**: Redeploys via Vercel’s GitHub integration
- **GitHub Pages**: Redeploys via `.github/workflows/deploy.yml`

---

## Your Live URLs

- **Vercel**: `https://temporal-tides-<team>.vercel.app` or your custom domain
- **GitHub Pages**: `https://shaiss.github.io/TemporalTides/`

---

## How It Works

- **Base path**: `base` in VitePress is set to `/` on Vercel and `/TemporalTides/` on GitHub Pages
- **Cache**: Assets under `/assets/` use long-lived cache headers for faster loads

---

## Custom Domain (Optional)

In the Vercel project dashboard:

1. Go to **Settings** → **Domains**
2. Add your domain
3. Update DNS as shown
