# 🔔 Awakening Bell - Mindful Meditation Timer

<div align="center">

![Awakening Bell Icon](public/icons/icon-192.png)

**Privacy-focused, AI-enhanced meditation timer inspired by Thich Nhat Hanh's mindfulness teachings**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/yourusername/awakening-bell)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](https://web.dev/progressive-web-apps/)

[Live Demo](#) | [User Guide](docs/USER_GUIDE.md) | [Report Bug](https://github.com/yourusername/awakening-bell/issues) | [Request Feature](https://github.com/yourusername/awakening-bell/issues)

</div>

---

## ✨ Features

### 🧘 Meditation Modes
- **Periodic Mode**: Regular bell intervals (customizable from 5-60 minutes)
- **Random Mode**: Mindful randomness with configurable ranges
- **Hourly Mode**: Chime on the hour for all-day mindfulness
- **Reminder Mode**: Set specific bell times (Phase 2)

### 🔊 Audio Experience
- **Synthesized Bell Sounds**: Two beautiful bell tones (Big Bell & Small Bell)
- **No Audio Files**: Uses Web Audio API for perfect, real-time synthesis
- **Volume Controls**: Adjustable volume and mute toggle
- **Background Playback**: Works even in background tabs

### 🤖 AI-Powered Insights
- **Mood Tracking**: Pre and post-session mood check-ins
- **Pattern Detection**: Discover your meditation patterns
- **Personalized Insights**: AI-generated suggestions based on your practice
- **Statistics Dashboard**: Track sessions, streaks, and progress

### 🔒 Privacy First
- **100% Local Storage**: All data stays on your device
- **No Server**: No data ever leaves your browser
- **No Tracking**: No analytics, cookies, or third-party scripts
- **Optional Features**: Toggle mood tracking and insights
- **Data Export**: Download your data anytime as CSV
- **Easy Deletion**: One-click data removal

### 📱 Progressive Web App
- **Installable**: Add to home screen (mobile) or desktop
- **Offline Ready**: Works completely without internet
- **Fast & Responsive**: Optimized for all screen sizes
- **Service Worker**: Instant loading and updates

---

## 🚀 Quick Start

### For Users

1. **Visit the App**: [Live Demo](#) (replace with your URL)
2. **Install PWA** (optional):
   - **Desktop**: Click install icon in browser address bar
   - **Mobile**: Tap "Share" → "Add to Home Screen"
3. **Start Meditating**: Choose a mode, set duration, and begin!

### For Developers

```bash
# Clone repository
git clone https://github.com/yourusername/awakening-bell.git
cd awakening-bell

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 📖 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete guide to using the app
- **[Deployment Guide](docs/DEPLOYMENT.md)**: How to deploy to production
- **[Testing Documentation](docs/TESTING.md)**: Testing procedures and results
- **[Contributing Guide](CONTRIBUTING.md)**: How to contribute to the project
- **[Changelog](CHANGELOG.md)**: Version history and updates

---

## 🎨 Screenshots

### Timer Interface
![Timer Interface](docs/screenshots/meditation-timer.png)
*Clean, distraction-free timer with breathing animation*

### Insights Dashboard
![Insights Dashboard](docs/screenshots/stats-insights.png)
*AI-generated insights and progress tracking*

### Mood Tracking
![Mood Tracking](docs/screenshots/mood-check.png)
*Optional pre/post-session mood check-ins*

### Session History
![Session History](docs/screenshots/session-history.png)
*Complete history of your meditation practice*

---

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript**: No frameworks - pure Web Components
- **Vite**: Fast build tool and dev server
- **Web Audio API**: Real-time bell sound synthesis
- **Service Workers**: Offline functionality and caching
- **localStorage**: Client-side data persistence

### Testing
- **Vitest**: Unit and integration testing
- **jsdom**: Browser environment simulation
- **V8 Coverage**: Code coverage reporting

### Design
- **CSS Custom Properties**: Design tokens for theming
- **CSS Grid & Flexbox**: Responsive layout
- **CSS Animations**: Smooth transitions and breathing circle
- **System Fonts**: Fast loading, no web fonts

### AI/ML (Client-Side)
- **Pattern Detection**: Session pattern analysis
- **Insight Generation**: Rule-based suggestion engine
- **Mood Analytics**: Trend analysis and correlations

---

## 📂 Project Structure

```
awakening-bell/
├── public/                  # Static assets
│   ├── icons/              # PWA icons (72px-512px)
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service worker
├── src/
│   ├── ai/                # AI/ML modules
│   │   ├── InsightGenerator.js
│   │   ├── MoodTracker.js
│   │   ├── PatternDetector.js
│   │   └── SuggestionEngine.js
│   ├── audio/             # Audio system
│   │   ├── AudioSystem.js
│   │   ├── BellSynthesizer.js
│   │   ├── VolumeController.js
│   │   └── AudioScheduler.js
│   ├── components/        # Web Components
│   │   ├── AppShell.js
│   │   ├── TimerDisplay.js
│   │   ├── MoodCheckModal.js
│   │   ├── InsightsDashboard.js
│   │   └── ...
│   ├── core/              # Core logic
│   │   ├── EventBus.js
│   │   ├── StateManager.js
│   │   ├── TimerEngine.js
│   │   ├── SessionManager.js
│   │   └── modes/         # Timer modes
│   ├── storage/           # Data persistence
│   │   ├── StorageManager.js
│   │   ├── SessionStore.js
│   │   ├── InsightsStore.js
│   │   └── DataPortability.js
│   ├── styles/            # Global styles
│   │   ├── design-tokens.css
│   │   ├── global.css
│   │   └── animations.css
│   ├── utils/             # Utilities
│   │   ├── time.js
│   │   ├── validation.js
│   │   └── performance.js
│   └── main.js            # App entry point
├── tests/                 # Test suites
├── docs/                  # Documentation
├── generate-icons.js      # Icon generator script
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

---

## 🧪 Testing

The app has comprehensive test coverage:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui

# Watch mode
npm test -- --watch
```

**Coverage Targets**: 80%+ for lines, branches, functions, and statements

**Test Suites**:
- Core logic (EventBus, StateManager, TimerEngine)
- Timer modes (Periodic, Random, Hourly)
- Storage system (localStorage persistence)
- Audio system (Web Audio API)
- AI modules (insights, patterns, mood)
- Utilities (validation, time formatting)

See [Testing Documentation](docs/TESTING.md) for detailed results.

---

## 🚢 Deployment

The app is production-ready and can be deployed to various platforms:

### Recommended: Netlify
```bash
# 1. Push to GitHub
# 2. Connect repo to Netlify
# 3. Build command: npm run build
# 4. Publish directory: dist
# 5. Deploy!
```

### Alternative: Vercel
```bash
npm i -g vercel
vercel
```

### Alternative: GitHub Pages
```bash
# Update vite.config.js base path
# Run deployment script
./deploy-gh-pages.sh
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🌟 Philosophy

Awakening Bell is inspired by **Thich Nhat Hanh's mindfulness bell** practice - a gentle reminder to return to the present moment throughout the day.

> *"The bell of mindfulness calls us back to ourselves. The bell can bring us back to life, help us touch the wonders of life that are in us and around us."* - Thich Nhat Hanh

### Design Principles
- **Simplicity**: Clean, distraction-free interface
- **Privacy**: Your data belongs to you, period
- **Accessibility**: Usable by everyone, everywhere
- **Open Source**: Free software for the benefit of all beings

---

## 🤝 Contributing

Contributions are welcome and appreciated! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests
- 🌍 Translate to other languages (Phase 3)
- 💬 Share feedback and experiences

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR**: Free to use, modify, and distribute. Give credit. No warranties.

---

## 🙏 Acknowledgments

### Inspiration
- **Thich Nhat Hanh** - For teaching the practice of mindful bells
- **Plum Village** - For keeping the tradition alive
- **Insight Timer** - For demonstrating the power of meditation apps
- **Open Source Community** - For tools that make this possible

### Technologies
- **Vite** - Blazing fast build tool
- **Vitest** - Delightful testing framework
- **Web Audio API** - For beautiful synthesized sounds
- **Service Workers** - For offline-first experiences

---

## 📮 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/awakening-bell/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/awakening-bell/discussions)
- **Email**: your.email@example.com

---

## 🗺️ Roadmap

### Phase 1 - MVP (Complete) ✅
- Core timer functionality
- Periodic, Random, Hourly modes
- Audio system with synthesized bells
- Basic mood tracking
- Insights dashboard
- PWA with offline support
- Privacy settings

### Phase 2 - Enhancements (Planned)
- Reminder mode (specific times)
- Multiple bell sounds
- Guided meditation sessions
- Advanced analytics
- Themes and customization
- Accessibility improvements

### Phase 3 - Community (Future)
- Cloud sync (optional)
- Community features
- Sharing insights
- Meditation guides
- Multi-language support
- Mobile native apps

---

## ❓ FAQ

**Q: Does this work offline?**  
A: Yes! Once installed, it works completely offline.

**Q: Where is my data stored?**  
A: All data is stored locally in your browser's localStorage. Nothing goes to any server.

**Q: Can I export my data?**  
A: Yes! Go to Privacy tab → Export Data → Download CSV.

**Q: Is this really free?**  
A: Yes! Open source, MIT licensed, no premium features, no ads, no tracking.

**Q: Does it work on mobile?**  
A: Yes! Install as a PWA for the best experience.

**Q: Do I need an internet connection?**  
A: Only for the first visit to load the app. After that, fully offline.

**Q: What browsers are supported?**  
A: All modern browsers: Chrome, Firefox, Safari, Edge (desktop and mobile).

---

<div align="center">

Made with 🧡 for mindful beings everywhere

**May all beings be happy. May all beings be peaceful. May all beings be free.**

</div>
