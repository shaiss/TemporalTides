# ✅ VitePress Testing Checklist

Use this checklist to verify your VitePress installation is working perfectly!

---

## 🚀 Quick Test (2 minutes)

```bash
# 1. Start dev server
npm run docs:dev

# 2. Open browser
# Visit: http://localhost:5173

# 3. Check these:
```

- [ ] Homepage loads with hero section
- [ ] "Temporal Tides" title visible
- [ ] Navigation bar shows (Home, World Bible, Quick Links)
- [ ] Dark mode toggle works (moon icon)
- [ ] Mobile responsive (resize window)

---

## 🔍 Search Test (30 seconds)

- [ ] Press `/` key
- [ ] Search modal opens
- [ ] Type "iris"
- [ ] Results show Iris Green character page
- [ ] Click result and page loads

---

## 📄 Content Test (2 minutes)

- [ ] Click "World Bible" in nav
- [ ] Index page shows table of contents
- [ ] Click "Iris Green" in sidebar
- [ ] Character page loads
- [ ] Portrait image displays
- [ ] Table of contents shows on right
- [ ] Text is readable and formatted

---

## 🎨 Styling Test (1 minute)

- [ ] Colors are temporal blue/purple
- [ ] Dark mode changes colors smoothly
- [ ] Sidebar is collapsible
- [ ] Code blocks (if any) have syntax highlighting
- [ ] Links are colored and clickable

---

## ⚡ Hot Reload Test (1 minute)

```bash
# While dev server is running:

# 1. Open: docs/WorldBible/03_Characters/Heroes/Iris.md
# 2. Add a line: "## Test Edit"
# 3. Save file
```

- [ ] Browser updates automatically (<1 second)
- [ ] No page refresh needed
- [ ] Change is visible
- [ ] No errors in console

---

## 🏗️ Build Test (1 minute)

```bash
npm run docs:build
```

- [ ] Build completes successfully
- [ ] Time is ~3 seconds
- [ ] No fatal errors
- [ ] Output: "build complete in X.XXs"

---

## 📦 Preview Test (1 minute)

```bash
npm run docs:preview
```

- [ ] Preview server starts
- [ ] Visit: http://localhost:4173
- [ ] Site works same as dev server
- [ ] All pages accessible
- [ ] Images load

---

## 📱 Mobile Test (2 minutes)

```bash
# With dev server running, open on mobile OR resize browser to mobile size
```

- [ ] Hamburger menu appears
- [ ] Menu opens sidebar
- [ ] Content is readable (no zoom needed)
- [ ] Images scale properly
- [ ] Touch navigation works

---

## 🖼️ Image Test (1 minute)

Visit these pages and verify images load:
- [ ] Iris Green character page
- [ ] Vibrion character page
- [ ] Leo Thompson character page
- [ ] All portraits display correctly
- [ ] No broken image icons

---

## 🧭 Navigation Test (2 minutes)

- [ ] Click through all 9 main sections in sidebar
- [ ] Each section loads
- [ ] Previous/Next buttons work
- [ ] Breadcrumb trail shows current location
- [ ] Back button works as expected

---

## 📊 All Features Test

### Homepage
- [ ] Hero section with Temporal Tides title
- [ ] Feature cards (6 total)
- [ ] Action buttons work
- [ ] Layout is centered and balanced

### Sidebar
- [ ] 9 main sections visible
- [ ] Heroes subsection (7 characters)
- [ ] Mentors subsection (2 characters)
- [ ] Antagonists subsection (3 antagonists)
- [ ] Sections collapse/expand
- [ ] Active page highlighted

### Search
- [ ] Opens with `/` key
- [ ] Search icon in navbar works
- [ ] Results update as you type
- [ ] Results show context
- [ ] Clicking result navigates to page

### Dark Mode
- [ ] Toggle icon in navbar (moon/sun)
- [ ] Switches between light/dark
- [ ] All content readable in both modes
- [ ] Images look good in both modes
- [ ] Smooth transition

### Table of Contents
- [ ] Shows on right side of pages
- [ ] Lists h2 and h3 headings
- [ ] Clicking jumps to section
- [ ] Active section highlighted
- [ ] Scrolls with page

---

## 🛠️ Script Tests

```bash
# Test helper scripts
./scripts/sync-worldbible.sh
```
- [ ] Syncs without errors
- [ ] Content updated in docs/

```bash
./scripts/build-and-check.sh
```
- [ ] Builds successfully
- [ ] Shows build size
- [ ] No errors

```bash
./RUN_VITEPRESS.sh
```
- [ ] Starts dev server
- [ ] Shows helpful messages
- [ ] Server runs normally

---

## 🎯 Performance Checks

- [ ] Dev server starts in 1-2 seconds
- [ ] Hot reload updates in <100ms
- [ ] Build completes in ~3 seconds
- [ ] Pages load instantly (SPA navigation)
- [ ] Search is responsive (no lag)

---

## ✅ Final Checklist

All of these should be ✅:

- [ ] Installation completed successfully
- [ ] Dev server starts and runs
- [ ] Homepage loads correctly
- [ ] All 54 pages accessible
- [ ] All 10 images display
- [ ] Search works
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Hot reload functional
- [ ] Build succeeds
- [ ] Preview works
- [ ] No console errors
- [ ] Documentation readable

---

## 🎊 Success!

If all items are checked, your VitePress installation is **perfect**!

If any items fail:
1. Check [VITEPRESS_SETUP.md](VITEPRESS_SETUP.md) troubleshooting section
2. Verify all files in place
3. Try rebuilding: `npm run docs:build`
4. Clear cache: `rm -rf docs/.vitepress/cache`

---

**Happy testing!** 🧪✨
