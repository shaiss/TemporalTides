# 🚀 VitePress Quick Start

## Start Your World Bible Now!

```bash
# Start the dev server
npm run docs:dev
```

Then open in your browser: **http://localhost:5173**

---

## 📝 Edit Content

### Option 1: Edit docs/ directly (recommended)
```bash
# Edit any file
vim docs/WorldBible/03_Characters/Heroes/NewCharacter.md

# Save - changes appear instantly in browser!
```

### Option 2: Edit WorldBible/ and sync
```bash
# Edit original files
vim WorldBible/03_Characters/Heroes/NewCharacter.md

# Sync to docs
./scripts/sync-worldbible.sh
```

---

## 🎨 Add Images

```bash
# 1. Put image in assets folder
cp myimage.jpg assets/character_portraits/

# 2. Sync to docs
./scripts/sync-worldbible.sh

# 3. Reference in markdown (absolute path)
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

Output: `docs/.vitepress/dist/` (ready to deploy!)

---

## 🆘 Common Commands

| Command | What it does |
|---------|--------------|
| `npm run docs:dev` | Start dev server (port 5173) |
| `npm run docs:build` | Build for production |
| `npm run docs:preview` | Preview production build |
| `npm start` | Same as docs:dev |

---

## 📁 Where Things Are

- **Content**: `docs/WorldBible/`
- **Images**: `docs/public/assets/character_portraits/`
- **Homepage**: `docs/index.md`
- **Config**: `docs/.vitepress/config.js`
- **Styles**: `docs/.vitepress/theme/custom.css`

---

## ⚡ Tips

1. **Hot reload is instant** - Just save and watch browser update
2. **Search is automatic** - No configuration needed
3. **Dark mode** - Click moon icon in navbar
4. **Mobile works** - Responsive out of the box

---

## 📚 Full Documentation

- **Setup Guide**: `VITEPRESS_SETUP.md`
- **Test Report**: `VITEPRESS_TEST_REPORT.md`
- **Comparison**: `DOCUMENTATION_PLATFORM_COMPARISON.md`

---

**You're ready to go! Start with:**
```bash
npm run docs:dev
```

🌊 Happy world building!
