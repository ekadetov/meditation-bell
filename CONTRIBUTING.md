# Contributing to Awakening Bell

First off, thank you for considering contributing to Awakening Bell! 🙏

It's people like you that make Awakening Bell a great tool for mindfulness practitioners around the world.

## 📖 Table of Contents

- [Contributing to Awakening Bell](#contributing-to-awakening-bell)
  - [📖 Table of Contents](#-table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [I Don't Want to Contribute, I Just Have a Question](#i-dont-want-to-contribute-i-just-have-a-question)
  - [How Can I Contribute?](#how-can-i-contribute)
    - [Reporting Bugs](#reporting-bugs)
      - [Before Submitting A Bug Report](#before-submitting-a-bug-report)
      - [How Do I Submit A Good Bug Report?](#how-do-i-submit-a-good-bug-report)
    - [Suggesting Enhancements](#suggesting-enhancements)
      - [Before Submitting An Enhancement Suggestion](#before-submitting-an-enhancement-suggestion)
      - [How Do I Submit A Good Enhancement Suggestion?](#how-do-i-submit-a-good-enhancement-suggestion)
    - [Your First Code Contribution](#your-first-code-contribution)
      - [Local Development Setup](#local-development-setup)
      - [Project Structure Overview](#project-structure-overview)
      - [Running Tests](#running-tests)
      - [Building for Production](#building-for-production)
    - [Pull Requests](#pull-requests)
      - [Pull Request Process](#pull-request-process)
      - [Pull Request Checklist](#pull-request-checklist)
      - [PR Review Process](#pr-review-process)
  - [Style Guides](#style-guides)
    - [Git Commit Messages](#git-commit-messages)
    - [JavaScript Style Guide](#javascript-style-guide)
    - [CSS Style Guide](#css-style-guide)
    - [Documentation Style Guide](#documentation-style-guide)
  - [Additional Notes](#additional-notes)
    - [Issue and Pull Request Labels](#issue-and-pull-request-labels)
    - [Recognition](#recognition)
    - [Questions?](#questions)
  - [Thank You! 🙏](#thank-you-)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to mindfulness and compassion. By participating, you are expected to uphold these values:

- **Be Kind**: Treat everyone with respect and compassion
- **Be Mindful**: Consider the impact of your words and actions
- **Be Inclusive**: Welcome and support people of all backgrounds
- **Be Patient**: We all learn at different paces
- **Be Constructive**: Provide helpful, actionable feedback

In the spirit of Thich Nhat Hanh's teachings, we practice:
- Deep listening
- Loving speech
- Non-judgment
- Patience and understanding

## I Don't Want to Contribute, I Just Have a Question

> **Note:** Please don't file an issue to ask a question. You'll get faster results by using the resources below.

- Read the [User Guide](docs/USER_GUIDE.md)
- Check the [FAQ section](README.md#faq) in README
- Search [existing issues](https://github.com/yourusername/awakening-bell/issues)
- Ask in [GitHub Discussions](https://github.com/yourusername/awakening-bell/discussions)

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

#### Before Submitting A Bug Report

- **Check the [User Guide](docs/USER_GUIDE.md)** - you might discover that the issue is actually a feature!
- **Search [existing issues](https://github.com/yourusername/awakening-bell/issues)** - the bug might already be reported
- **Check if the bug is already fixed** - try reproducing it with the latest version
- **Determine which browser** you're using - bugs can be browser-specific

#### How Do I Submit A Good Bug Report?

Bugs are tracked as [GitHub issues](https://github.com/yourusername/awakening-bell/issues). Create an issue and provide the following information:

**Use a clear and descriptive title** for the issue to identify the problem.

**Describe the exact steps to reproduce**:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Provide specific examples** to demonstrate the steps. Include:
- Screenshots or GIFs showing the problem
- Browser console logs (F12 → Console tab)
- Network errors (F12 → Network tab)

**Describe the behavior you observed** and **what you expected to see**.

**Include details about your environment**:
- **OS**: e.g., macOS Sonoma 14.2
- **Browser**: e.g., Chrome 120.0.6099.109
- **Device**: e.g., iPhone 13 Pro, Desktop
- **App Version**: Check footer or `localStorage.getItem('awakening-bell-version')`

**Example Bug Report**:
```markdown
**Title**: Timer doesn't pause in Random mode

**Description**: 
When using Random mode, clicking the Pause button doesn't actually pause the timer. The elapsed time continues to increment.

**Steps to Reproduce**:
1. Select Random mode
2. Set min interval to 5 min, max to 10 min
3. Click Start
4. Wait 30 seconds
5. Click Pause
6. Observe elapsed time continues increasing

**Expected**: Timer should pause and elapsed time should stop

**Actual**: Timer continues running

**Environment**:
- OS: macOS Sonoma 14.2
- Browser: Chrome 120
- Version: 1.0.0

**Console Errors**: None
**Screenshots**: [attached]
```

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements.

#### Before Submitting An Enhancement Suggestion

- **Check the [roadmap](CHANGELOG.md#future-roadmap)** - it might already be planned
- **Search [existing issues](https://github.com/yourusername/awakening-bell/issues)** to see if it's already suggested
- **Read the [User Guide](docs/USER_GUIDE.md)** to ensure it doesn't already exist

#### How Do I Submit A Good Enhancement Suggestion?

Enhancement suggestions are tracked as [GitHub issues](https://github.com/yourusername/awakening-bell/issues). Create an issue with:

- **Clear and descriptive title**
- **Detailed description** of the suggested enhancement
- **Explain why this would be useful** to most users
- **List some examples** of how it would be used
- **Mockups or wireframes** if applicable
- **Similar features** in other apps (if relevant)

**Example Enhancement Suggestion**:
```markdown
**Title**: Add guided breathing exercises

**Description**: 
Add optional guided breathing exercises with visual and audio cues to help beginners learn proper breathing techniques.

**Why Useful**:
Many meditation beginners struggle with breathing. Guided exercises would:
- Help establish good breathing habits
- Make the app more welcoming to newcomers
- Complement the bell timer functionality

**How It Would Work**:
1. New "Guided Breathing" mode in mode selector
2. Options: 4-7-8 breathing, box breathing, etc.
3. Visual circle expands/contracts with breath
4. Optional voice guidance ("Breathe in... hold... breathe out...")
5. Configurable duration (1-20 minutes)

**Examples**:
- Calm app's breathing bubble
- Headspace breathing exercises
- Apple Watch Breathe app

**Mockup**: [attached wireframe]
```

### Your First Code Contribution

Unsure where to begin? Look for issues tagged:

- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed
- `bug` - Something isn't working
- `enhancement` - New feature or improvement

#### Local Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/awakening-bell.git
   cd awakening-bell
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```
5. **Open browser** to `http://localhost:3000`

#### Project Structure Overview

```
src/
├── ai/          # AI/ML modules (insights, patterns)
├── audio/       # Audio system (Web Audio API)
├── components/  # Web Components (UI)
├── core/        # Core logic (timer, state)
├── storage/     # Data persistence
├── styles/      # Global CSS
├── utils/       # Utility functions
└── main.js      # App entry point
```

#### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Interactive UI
npm run test:ui

# Watch mode
npm test -- --watch
```

**Coverage target**: 80% for lines, branches, functions, statements

#### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Pull Requests

The process described here has several goals:
- Maintain code quality
- Fix problems important to users
- Enable sustainable review process
- Build community

#### Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**:
   - Follow the [Style Guides](#style-guides)
   - Add/update tests as needed
   - Add/update documentation

3. **Test your changes**:
   ```bash
   npm test           # Run tests
   npm run lint       # Run linter
   npm run build      # Ensure it builds
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add guided breathing mode"
   ```
   See [Git Commit Messages](#git-commit-messages) for conventions

5. **Push to your fork**:
   ```bash
   git push origin feature/my-new-feature
   ```

6. **Create Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template
   - Link any related issues

#### Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows the style guidelines
- [ ] Self-review performed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] Lint checks passing
- [ ] Build succeeds
- [ ] Tested on multiple browsers (if UI change)
- [ ] Accessibility checked (if UI change)

#### PR Review Process

1. **Automated checks** must pass (tests, linting)
2. **Maintainer review** - may request changes
3. **Approved** - merged to `main`
4. **Deployed** - included in next release

**Be patient!** Reviews may take a few days. Feel free to politely ping after a week.

## Style Guides

### Git Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(audio): add volume fade in/out
fix(timer): resolve pause bug in random mode
docs(readme): update installation instructions
style(components): format timer display component
refactor(core): simplify event bus implementation
perf(audio): optimize bell synthesis
test(storage): add session store tests
chore(deps): update vite to v5.0.12
```

**Guidelines**:
- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- Lowercase first letter
- No period at the end
- Limit to 50 characters
- Add body for complex changes

### JavaScript Style Guide

We use vanilla JavaScript (ES2020+) with JSDoc comments.

**General Principles**:
- **Prefer clarity** over cleverness
- **Write self-documenting code**
- **Use modern JavaScript** features
- **Avoid dependencies** when possible

**Code Style**:
```javascript
/**
 * Calculate next bell time for random mode
 * @param {number} minInterval - Minimum interval in minutes
 * @param {number} maxInterval - Maximum interval in minutes
 * @returns {number} Next bell time in milliseconds
 */
export function calculateNextBell(minInterval, maxInterval) {
  // Validate inputs
  if (minInterval < 1 || maxInterval < minInterval) {
    throw new Error('Invalid interval range');
  }
  
  // Generate random interval
  const randomMinutes = minInterval + Math.random() * (maxInterval - minInterval);
  
  // Convert to milliseconds
  return randomMinutes * 60 * 1000;
}
```

**Best Practices**:
- Use `const` by default, `let` when necessary, never `var`
- Use arrow functions for callbacks
- Use template literals for strings
- Use destructuring for objects/arrays
- Use default parameters
- Add JSDoc comments for functions
- Validate inputs
- Handle errors gracefully
- Keep functions small and focused

**Naming Conventions**:
- `camelCase` for variables and functions
- `PascalCase` for classes and components
- `SCREAMING_SNAKE_CASE` for constants
- Prefix private methods with `#`

### CSS Style Guide

We use vanilla CSS with custom properties (CSS variables).

**Structure**:
```css
/* Component: timer-display */

/* Layout */
.timer-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

/* Typography */
.timer-display__time {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  color: var(--color-text-primary);
}

/* State modifiers */
.timer-display--running {
  opacity: 1;
}

.timer-display--paused {
  opacity: 0.7;
}
```

**Best Practices**:
- Use CSS custom properties (design tokens)
- Use BEM naming for clarity
- Group related properties
- Comment sections
- Mobile-first responsive design
- Avoid !important
- Prefer flexbox/grid over floats
- Use semantic HTML

### Documentation Style Guide

**Markdown Format**:
- Use ATX-style headers (`#`, `##`, `###`)
- Add blank lines around headers
- Use fenced code blocks with language
- Add alt text to images
- Use relative links for internal docs

**JSDoc Format**:
```javascript
/**
 * Brief description of function
 * 
 * More detailed explanation if needed.
 * Can span multiple lines.
 * 
 * @param {string} name - Description of parameter
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enabled=true] - Whether feature is enabled
 * @returns {Promise<number>} Description of return value
 * @throws {Error} When invalid input provided
 * 
 * @example
 * const result = await doSomething('test', { enabled: true });
 */
```

## Additional Notes

### Issue and Pull Request Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `documentation` | Documentation improvements |
| `good-first-issue` | Good for newcomers |
| `help-wanted` | Extra attention needed |
| `question` | Further information requested |
| `wontfix` | Will not be worked on |
| `duplicate` | Already exists |
| `invalid` | Not relevant or incorrect |

### Recognition

Contributors will be:
- Listed in release notes
- Added to contributors list (if desired)
- Thanked in the community

### Questions?

Feel free to:
- Open a [Discussion](https://github.com/yourusername/awakening-bell/discussions)
- Email: your.email@example.com
- Check [existing issues](https://github.com/yourusername/awakening-bell/issues)

---

## Thank You! 🙏

Your contributions, large or small, make a real difference. By helping improve Awakening Bell, you're supporting mindfulness practice for people around the world.

**May your practice be peaceful. May your code be clean. May all beings benefit.** 🧡

---

<div align="center">

**With gratitude,**  
The Awakening Bell Team

</div>
