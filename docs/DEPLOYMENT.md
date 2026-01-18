# Awakening Bell - Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, ensure all items are completed:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No console errors in production build
- [ ] Linting passes (`npm run lint`)
- [ ] Code coverage meets thresholds (80%+)
- [ ] No TODO/FIXME comments in critical code

### Performance
- [ ] Lighthouse score > 90 (all categories)
- [ ] Bundle size < 150KB gzipped
- [ ] Images optimized
- [ ] Service Worker registered correctly
- [ ] Offline mode tested

### Security
- [ ] No hardcoded secrets or API keys
- [ ] CSP headers configured
- [ ] HTTPS enforced (platform default)
- [ ] Input validation implemented
- [ ] Dependencies up to date (no critical vulnerabilities)

### Functionality
- [ ] All timer modes work (Periodic, Random, Hourly)
- [ ] Audio playback functions correctly
- [ ] PWA installable on desktop and mobile
- [ ] Data persistence verified
- [ ] Privacy controls functional
- [ ] Cross-browser tested

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md created
- [ ] License file added
- [ ] Environment variables documented

## Environment Setup

### System Requirements
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Modern browser** with Web Audio API support

### Installation
```bash
# Clone repository
git clone <repository-url>
cd meditation-bell

# Install dependencies
npm install

# Verify installation
npm test
```

## Build Instructions

### Development Build
```bash
# Start development server with hot reload
npm run dev

# Access at http://localhost:3000
```

### Production Build
```bash
# Create optimized production bundle
npm run build

# Output directory: dist/
# Assets minified and optimized
# Source maps generated
```

### Preview Production Build
```bash
# Preview production build locally
npm run preview

# Access at http://localhost:4173
# Test PWA installation, service worker, offline mode
```

## Testing Procedures

### Automated Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

### Manual Testing Checklist

#### Core Functionality
1. **Timer Modes**
   - Start Periodic mode (default 15 min)
   - Verify bell rings at intervals
   - Test Random mode variability
   - Check Hourly mode (on the hour)

2. **Audio System**
   - Test both bell sounds (Big Bell, Small Bell)
   - Verify volume controls work
   - Check audio plays in background tab
   - Confirm no audio glitches

3. **Mood Tracking**
   - Pre-session mood modal appears
   - Post-session mood modal appears after timer
   - Mood data saved correctly
   - Privacy toggle works

4. **Data Management**
   - Sessions save to history
   - Stats display correctly
   - Insights generate (after 3+ sessions)
   - CSV export downloads
   - Data deletion works with confirmation

5. **PWA Features**
   - App installs on desktop (Chrome icon)
   - Works offline (disable network)
   - Service worker updates
   - App shortcuts work

#### Browser Testing
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

#### Accessibility Testing
- Keyboard navigation (Tab, Enter, Arrows)
- Screen reader compatibility
- Color contrast (WCAG AA)
- Focus indicators visible
- ARIA labels present

## Deployment Platforms

### Option 1: Netlify (Recommended)

**Why Netlify:**
- Zero-config deployment
- Automatic HTTPS
- CDN included
- Easy rollbacks
- Free tier available

**Steps:**
1. Push code to GitHub
2. Login to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Connect your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"
7. Custom domain (optional): Site settings → Domain management

**Environment Variables:**
- No environment variables required for basic deployment
- Add in Site settings → Build & deploy → Environment

**Post-Deployment:**
- Test PWA installation
- Verify HTTPS
- Check service worker registration
- Test offline mode

### Option 2: Vercel

**Why Vercel:**
- Optimized for modern web apps
- Edge network
- Automatic HTTPS
- Git integration

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run deployment command:
   ```bash
   vercel
   ```
3. Follow prompts:
   - Link to existing project or create new
   - Auto-detects Vite settings
   - Choose production deployment
4. Access deployed URL

**Configuration:**
Create `vercel.json` (optional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Option 3: GitHub Pages

**Why GitHub Pages:**
- Free hosting for public repos
- Simple GitHub integration
- Custom domains supported

**Steps:**

1. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/meditation-bell/', // Replace with your repo name
  // ... rest of config
});
```

2. Create deployment script `deploy-gh-pages.sh`:
```bash
#!/bin/bash
npm run build
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:username/meditation-bell.git main:gh-pages
cd ..
```

3. Make executable and run:
```bash
chmod +x deploy-gh-pages.sh
./deploy-gh-pages.sh
```

4. Enable GitHub Pages:
   - Go to repository Settings
   - Pages section
   - Source: Deploy from branch
   - Branch: gh-pages, / (root)

5. Access at: `https://username.github.io/meditation-bell/`

**Note:** Update manifest.json `start_url` and `scope` to match base path.

## Post-Deployment Verification

### Immediate Checks
1. **Site Loads**: Visit deployed URL
2. **HTTPS Active**: Check for padlock icon
3. **No Console Errors**: Open DevTools console
4. **Service Worker**: Check Application tab → Service Workers
5. **PWA Installable**: Look for install icon in browser

### Functional Testing
- [ ] Timer starts and stops
- [ ] Bell sounds play
- [ ] Mood tracking works
- [ ] Data persists across page reload
- [ ] Offline mode functions
- [ ] PWA installs successfully

### Performance Verification
Run Lighthouse audit on deployed URL:
- Performance > 90
- Accessibility > 90
- Best Practices > 90
- SEO > 90
- PWA = 100

### Cross-Device Testing
Test on:
- Desktop browser
- Mobile browser
- Installed PWA (desktop)
- Installed PWA (mobile)

## Rollback Procedures

### Netlify
1. Go to Deploys tab
2. Find previous working deployment
3. Click "Publish deploy"
4. Confirm rollback

### Vercel
```bash
# List recent deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

### GitHub Pages
```bash
# Revert to previous commit
git revert HEAD
git push origin gh-pages

# Or force push previous commit
git reset --hard HEAD~1
git push -f origin gh-pages
```

## Monitoring & Maintenance

### Health Checks
- Monitor site uptime (UptimeRobot, Pingdom)
- Check error logs regularly
- Review user feedback

### Updates
- Update dependencies monthly
- Test updates in staging first
- Review security advisories

### Backup
- Database: localStorage data is client-side (users responsible)
- Code: Git repository is source of truth
- Encourage users to export data regularly

## Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Service Worker Not Updating
- Clear browser cache
- Hard reload (Cmd+Shift+R / Ctrl+Shift+R)
- Unregister old service worker in DevTools

### PWA Not Installing
- Verify HTTPS is active
- Check manifest.json is accessible
- Ensure all icons exist
- Review console for errors

### Audio Not Playing
- Check user interaction requirement (Web Audio API)
- Verify AudioContext not suspended
- Test on different browsers

## CI/CD Integration (Optional)

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## Support & Resources

- **Documentation**: See `docs/` folder
- **User Guide**: `docs/USER_GUIDE.md`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Deployment Summary

**Recommended Platform**: Netlify
**Build Time**: ~30 seconds
**Bundle Size**: <150KB gzipped
**Hosting Cost**: Free tier available on all platforms
**HTTPS**: Automatic on all platforms
**CDN**: Included on Netlify and Vercel

Ready to deploy! 🚀
