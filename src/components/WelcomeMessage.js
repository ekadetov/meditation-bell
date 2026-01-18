/**
 * WelcomeMessage Component
 * 
 * Displays an inspirational quote and brief instructions on first load.
 * Uses beautiful typography with a gentle fade-in animation.
 */

export class WelcomeMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .welcome {
          max-width: 700px;
          margin: 0 auto var(--space-12);
          text-align: center;
          animation: fadeInUp 800ms var(--ease-out);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .quote {
          font-family: var(--font-serif);
          font-size: var(--font-size-xl);
          font-style: italic;
          color: var(--color-primary);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--space-6);
          position: relative;
        }

        .quote::before,
        .quote::after {
          content: '"';
          font-size: var(--font-size-4xl);
          color: var(--color-accent);
          opacity: 0.3;
        }

        .quote-author {
          display: block;
          font-size: var(--font-size-base);
          font-style: normal;
          color: var(--color-text-secondary);
          margin-top: var(--space-4);
          font-family: var(--font-sans);
        }

        .instructions {
          background: var(--color-bg-elevated);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          margin-top: var(--space-8);
        }

        .instructions-title {
          font-family: var(--font-serif);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-4);
        }

        .instructions-list {
          text-align: left;
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        .instruction-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .instruction-item:last-child {
          margin-bottom: 0;
        }

        .instruction-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-primary-subtle);
          color: var(--color-primary);
          border-radius: 50%;
          font-weight: var(--font-weight-semibold);
          font-size: var(--font-size-sm);
          flex-shrink: 0;
        }

        .instruction-text {
          flex: 1;
          padding-top: 4px;
        }

        .divider {
          height: 1px;
          background: linear-gradient(
            to right,
            transparent,
            var(--color-border-light) 20%,
            var(--color-border-light) 80%,
            transparent
          );
          margin: var(--space-8) 0;
        }

        @media (max-width: 639px) {
          .quote {
            font-size: var(--font-size-lg);
          }

          .instructions {
            padding: var(--space-4);
            text-align: left;
          }

          .instructions-title {
            font-size: var(--font-size-lg);
          }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .welcome {
            animation: none;
            opacity: 1;
          }
        }
      </style>

      <div class="welcome">
        <blockquote class="quote">
          The present moment is filled with joy and happiness.
          If you are attentive, you will see it.
          <cite class="quote-author">— Thich Nhat Hanh</cite>
        </blockquote>

        <div class="divider" role="separator"></div>

        <div class="instructions">
          <h2 class="instructions-title">How to Use Awakening Bell</h2>
          <div class="instructions-list">
            <div class="instruction-item">
              <span class="instruction-number" aria-hidden="true">1</span>
              <div class="instruction-text">
                <strong>Choose a timer mode</strong> below that suits your practice
                (Periodic, Random, Reminder, or Hourly).
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number" aria-hidden="true">2</span>
              <div class="instruction-text">
                <strong>Set your intervals</strong> for when you'd like to hear
                the mindfulness bells.
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number" aria-hidden="true">3</span>
              <div class="instruction-text">
                <strong>Start your session</strong> and when the bell sounds,
                pause to take three conscious breaths.
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number" aria-hidden="true">4</span>
              <div class="instruction-text">
                <strong>Return to the present</strong> with a smile, then
                continue your day with renewed awareness.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('welcome-message', WelcomeMessage);
