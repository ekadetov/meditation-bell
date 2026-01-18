# Security Policy

## 🔒 Security Overview

Awakening Bell takes security and privacy seriously. This document outlines our security practices and how to report vulnerabilities.

## 🛡️ Security Features

### Privacy-First Architecture
- **100% Client-Side**: All code runs in your browser
- **No Server Communication**: Zero external requests after initial page load
- **Local Data Storage**: All data stays on your device (localStorage)
- **No Tracking**: No analytics, cookies, or third-party scripts
- **No Authentication**: No user accounts, passwords, or personal information collected

### Data Protection
- **Encrypted Storage**: localStorage is browser-managed and isolated per-origin
- **No External Dependencies**: Minimal attack surface
- **Content Security Policy**: Strict CSP headers in production
- **HTTPS Only**: Enforced in production deployments
- **Same-Origin Policy**: Browser security prevents cross-origin access

### Application Security
- **Input Validation**: All user inputs sanitized and validated
- **XSS Protection**: No use of `innerHTML` with user content
- **No eval()**: Code does not use `eval()` or equivalent
- **Secure Dependencies**: Regular dependency audits
- **No Inline Scripts**: CSP-compliant code structure

## 📋 Security Checklist

### For Users
- ✅ All data stays on your device
- ✅ No login credentials required
- ✅ No personal information collected
- ✅ Works completely offline
- ✅ Export your data anytime
- ✅ Delete all data with one click

### For Developers
- ✅ No hardcoded secrets or API keys
- ✅ Dependencies regularly updated
- ✅ Security best practices followed
- ✅ Code reviews for all changes
- ✅ Automated security scans
- ✅ Minimal external dependencies

## 🔍 Data Collection

**We collect ZERO data**:
- ❌ No analytics
- ❌ No cookies
- ❌ No tracking pixels
- ❌ No fingerprinting
- ❌ No third-party scripts
- ❌ No server logs (no server!)

**What data exists**:
- ✅ Meditation sessions (stored locally only)
- ✅ Mood tracking (optional, stored locally only)
- ✅ User preferences (stored locally only)
- ✅ Insights (generated locally only)

All data can be exported (CSV) or deleted at any time.

## 🔐 Browser Security

### localStorage Security
- **Isolation**: Data isolated by origin (domain)
- **Persistence**: Survives page reloads, not across browsers
- **Quota**: Limited to ~5-10MB per origin (browser-dependent)
- **Access**: Only accessible by same-origin JavaScript

### Limitations to Know
- **Not encrypted by default**: localStorage is plain text
- **Accessible in DevTools**: User can view/edit in browser console
- **No server backup**: Data loss if browser cache cleared
- **Per-browser**: Not synced across devices

### Recommendations for Users
- Use a trusted, updated browser
- Enable browser security features
- Be cautious with browser extensions (they can access localStorage)
- Export data regularly as backup
- Clear app data when using shared computers

## 🚨 Reporting Vulnerabilities

### What to Report
We appreciate responsible disclosure of:
- Security vulnerabilities
- Privacy concerns
- Data leakage issues
- Authentication/authorization bugs (if added in future)
- Dependency vulnerabilities

### How to Report

**For security issues, DO NOT create a public GitHub issue.**

Instead, email: **security@example.com** (replace with actual email)

**Include**:
1. Description of vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)
5. Your contact information (if you want updates)

### What to Expect
1. **Acknowledgment**: Within 48 hours
2. **Assessment**: We'll evaluate severity
3. **Fix**: Timeline based on severity
4. **Disclosure**: Coordinated disclosure after fix
5. **Credit**: Recognition in release notes (if desired)

### Security Response SLA
- **Critical**: 24 hours
- **High**: 72 hours
- **Medium**: 1 week
- **Low**: 2 weeks

## 🎯 Security Best Practices

### For Deployment

#### Content Security Policy (CSP)
Recommended CSP headers for production:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'none';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'none';
```

#### HTTP Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### HTTPS
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Use HSTS header
- Valid SSL certificate

### For Development

#### Dependency Management
```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

#### Code Review Checklist
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No use of `eval()` or `innerHTML` with user data
- [ ] Dependencies up to date
- [ ] Tests cover security scenarios
- [ ] Error handling doesn't leak sensitive info
- [ ] XSS protection in place
- [ ] CSRF not applicable (no server)

## 🔧 Security Tools

### Automated Scanning
- **npm audit**: Dependency vulnerability scanning
- **GitHub Dependabot**: Automated dependency updates
- **Lighthouse**: Security best practices audit
- **OWASP ZAP**: Web application security scanner (optional)

### Manual Testing
- Browser DevTools Security tab
- Manual code review
- Penetration testing (for major releases)
- Accessibility + security combination

## 📚 Resources

### Standards & Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTPS Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security)

### Browser Security
- [localStorage Security](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#security)
- [Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [Web App Security](https://web.dev/security/)

## 🏆 Hall of Fame

We recognize security researchers who help improve Awakening Bell:

### 2026
- *No reports yet - be the first!*

(Contributors will be listed here with permission)

## 📜 Security Changelog

### v1.0.0 - 2026-01-18
- ✅ Initial security audit completed
- ✅ CSP headers documented
- ✅ Privacy-first architecture implemented
- ✅ No external dependencies for runtime
- ✅ Input validation implemented
- ✅ XSS protection verified

## ⚖️ Responsible Disclosure

We believe in coordinated vulnerability disclosure:

1. **Private Report**: Email security issues privately
2. **No Public Disclosure**: Until fix is released
3. **Coordinated Timeline**: We'll work with you on disclosure
4. **Credit Given**: Recognition in release notes
5. **Thank You**: Your help makes the app safer for everyone

## 🙏 Thank You

Security is a community effort. Thank you for helping keep Awakening Bell safe and secure for all users.

---

**Questions about security?**
Email: security@example.com

**Last Updated**: 2026-01-18
