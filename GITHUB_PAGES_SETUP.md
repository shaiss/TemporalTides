# GitHub Pages Deployment Setup

## 🚀 Automated Deployment Configured

VitePress is now configured to automatically deploy to GitHub Pages!

### What Was Set Up

1. **Base Path Configuration** - Updated VitePress config with `/TemporalTides/` base path
2. **GitHub Actions Workflow** - Created `.github/workflows/deploy-docs.yml`
3. **Automatic Builds** - Site will build and deploy on every push to `main` branch

### Your Documentation Site URL

Once deployed, your docs will be available at:
**https://shaiss.github.io/TemporalTides/**

### Required GitHub Repository Settings

⚠️ **Important:** You need to enable GitHub Pages in your repository settings:

1. Go to your repository: https://github.com/shaiss/TemporalTides
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

### How It Works

The workflow (`.github/workflows/deploy-docs.yml`) will:
- ✅ Trigger automatically on push to `main` branch
- ✅ Can also be triggered manually from Actions tab
- ✅ Install Node.js and dependencies
- ✅ Build the VitePress site
- ✅ Deploy to GitHub Pages
- ✅ Update your live site automatically

### First Deployment

To deploy for the first time:

1. **Merge this branch to main:**
   ```bash
   git checkout main
   git merge cursor/setup-and-test-vitepress-for-docs-75ce
   git push origin main
   ```

2. **Or create a Pull Request** and merge it through GitHub

3. **Watch the deployment:**
   - Go to https://github.com/shaiss/TemporalTides/actions
   - You'll see the "Deploy VitePress to GitHub Pages" workflow running
   - Takes ~2-3 minutes for first deployment

4. **Enable GitHub Pages** (if not already):
   - Repository Settings → Pages
   - Source: **GitHub Actions**

### Manual Deployment

You can also trigger deployment manually:
1. Go to https://github.com/shaiss/TemporalTides/actions
2. Click "Deploy VitePress to GitHub Pages"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Testing Locally with Production Base Path

To test the site with the production base path locally:
```bash
npm run docs:build
npm run docs:preview
```

The preview will run at http://localhost:4173/TemporalTides/

### Workflow Features

- ✅ **Automatic deployment** on push to main
- ✅ **Manual trigger** available
- ✅ **Caching** for faster builds
- ✅ **Proper permissions** configured
- ✅ **Concurrent deployment protection**

### Configuration Files

**VitePress Config:**
- `WorldBible/.vitepress/config.ts` - Base path set to `/TemporalTides/`

**GitHub Actions:**
- `.github/workflows/deploy-docs.yml` - Automated deployment workflow

### Troubleshooting

**If the site doesn't load after deployment:**
1. Check GitHub Actions logs for errors
2. Verify GitHub Pages is enabled in repository settings
3. Ensure Pages source is set to "GitHub Actions"
4. Wait 2-3 minutes for DNS propagation

**If images don't load:**
- They're already configured in `.vitepress/public/` ✅
- Base path is correctly set ✅

**If deployment fails:**
- Check the Actions tab for error messages
- Ensure `package-lock.json` is committed (for `npm ci`)
- Verify Node.js version compatibility

### Alternative: Custom Domain

If you want to use a custom domain instead:
1. Add a `CNAME` file to `WorldBible/.vitepress/public/`
2. Change `base: '/TemporalTides/'` to `base: '/'` in config
3. Configure DNS in your domain registrar

### Next Steps

1. ✅ Commit and push these changes to main (or merge PR)
2. ✅ Enable GitHub Pages in repository settings
3. ✅ Watch the first deployment in Actions tab
4. 🎉 Access your live docs at https://shaiss.github.io/TemporalTides/

---

*Setup completed: October 19, 2025*
