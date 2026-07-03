# 🚀 VitePress Quick Start

## Start Your World Bible Now!

```bash
# Start the dev server
npm run docs:dev
```

Then open in your browser: **http://localhost:5173**

---

## 📝 Edit Content

The site builds directly from the repo root — edit `WorldBible/` and changes appear instantly. No sync step.

```bash
# Edit any file
vim WorldBible/03_Characters/Heroes/NewCharacter.md

# Save - changes appear instantly in browser!
```

**Adding a new page?** Also add it to the sidebar in `.vitepress/config.js` — the sidebar is manually maintained, so new pages won't appear in navigation until listed there.

---

## 🎨 Add Images

```bash
# 1. Put image in the public assets folder
cp myimage.jpg public/assets/character_portraits/

# 2. Reference in markdown (absolute path — served from public/)
![Character](/assets/character_portraits/myimage.jpg)
```

---

## 🔍 Search

Press `/` or click search icon - that's it!

---

## 🏗️ Build for Production

```bash
# Build site
npm run docs:build

# Preview built site
npm run docs:preview
```

Output: `.vitepress/dist/` (ready to deploy!)

---

## 🆘 Common Commands

| Command | What it does |
|---------|--------------|
| `npm run docs:dev` | Start dev server (port 5173) |
| `npm run docs:build` | Build for production |
| `npm run docs:preview` | Preview production build |
| `npm start` | Same as docs:dev |
| `./scripts/check-links.sh` | Report broken internal links in WorldBible/ |

---

## 📁 Where Things Are

- **Content**: `WorldBible/`
- **Images**: `public/assets/character_portraits/`
- **Homepage**: `index.md`
- **Config**: `.vitepress/config.js`
- **Styles**: `.vitepress/theme/custom.css`

---

## ⚡ Tips

1. **Hot reload is instant** - Just save and watch browser update
2. **Search is automatic** - No configuration needed
3. **Dark mode** - Click moon icon in navbar
4. **Mobile works** - Responsive out of the box

---

## 📚 Full Documentation

- **Setup Guide**: `docs/reports/VITEPRESS_SETUP.md`
- **Test Report**: `docs/reports/VITEPRESS_TEST_REPORT.md`
- **Comparison**: `docs/reports/DOCUMENTATION_PLATFORM_COMPARISON.md`

---

**You're ready to go! Start with:**
```bash
npm run docs:dev
```

🌊 Happy world building!
