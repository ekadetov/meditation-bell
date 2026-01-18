/**
 * Footer Component
 * 
 * Application footer with contact information, credits, and version.
 */

export class Footer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;
    
    // Get version from package.json if available, otherwise default
    const version = this.getAttribute('version') || '1.0.0';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .footer {
          padding: var(--space-6) var(--space-6);
          text-align: center;
        }

        .footer-content {
          max-width: var(--container-lg);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--space-4);
          font-size: var(--font-size-sm);
        }

        .footer-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color var(--duration-fast) var(--ease-out);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
        }

        .footer-link:hover {
          color: var(--color-primary);
        }

        .footer-link:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }

        .divider {
          color: var(--color-border-dark);
          user-select: none;
        }

        .footer-credits {
          font-size: var(--font-size-sm);
          color: var(--color-text-tertiary);
          line-height: var(--line-height-relaxed);
        }

        .footer-quote {
          font-style: italic;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          max-width: 600px;
          margin: var(--space-4) auto 0;
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border-light);
        }

        .version {
          font-family: var(--font-mono);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--space-2);
        }

        @media (min-width: 1024px) {
          .footer {
            padding: var(--space-8) var(--space-8);
          }
        }
      </style>

      <footer class="footer" role="contentinfo">
        <div class="footer-content">
          <nav class="footer-links" aria-label="Footer navigation">
            <a 
              href="mailto:feedback@awakeningbell.app" 
              class="footer-link"
              aria-label="Send feedback via email"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Send Feedback
            </a>
            
            <span class="divider" aria-hidden="true">•</span>
            
            <a 
              href="#privacy" 
              class="footer-link"
              aria-label="View privacy notice"
            >
              Privacy
            </a>
            
            <span class="divider" aria-hidden="true">•</span>
            
            <a 
              href="#about" 
              class="footer-link"
              aria-label="About Awakening Bell"
            >
              About
            </a>
          </nav>

          <div class="footer-credits">
            <p>
              Inspired by the mindfulness teachings of 
              <strong>Thich Nhat Hanh</strong>
            </p>
            <p>
              Built with love and presence
            </p>
            <div class="version">v${version}</div>
          </div>

          <blockquote class="footer-quote">
            "Breathing in, I calm my body. Breathing out, I smile."
            <br>
            <cite>— Thich Nhat Hanh</cite>
          </blockquote>
        </div>
      </footer>
    `;
  }
}

// Register the custom element
customElements.define('app-footer', Footer);
