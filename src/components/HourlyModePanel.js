/**
 * HourlyModePanel Component
 * 
 * Configuration panel for hourly bell mode.
 * Simple mode that rings bells on the hour.
 */

export class HourlyModePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const startBtn = this.shadowRoot?.querySelector('[data-action="start-hourly"]');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('mode-config', {
          detail: {
            mode: 'hourly',
            config: {}
          },
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  getNextHour() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  render() {
    if (!this.shadowRoot) return;

    const nextHour = this.getNextHour();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .mode-panel {
          background: var(--color-bg-elevated);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
          text-align: center;
        }

        .panel-header {
          margin-bottom: var(--space-8);
        }

        .panel-title {
          font-family: var(--font-serif);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .panel-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
          max-width: 500px;
          margin: 0 auto;
        }

        .bell-illustration {
          width: 80px;
          height: 80px;
          margin: var(--space-6) auto;
          color: var(--color-primary);
        }

        .next-bell-info {
          background: var(--color-primary-subtle);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          margin: var(--space-6) 0;
        }

        .next-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
          margin-bottom: var(--space-2);
        }

        .next-time {
          font-family: var(--font-mono);
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          min-height: var(--button-height-lg);
          min-width: 200px;
          padding: var(--space-4) var(--space-8);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          background: var(--color-primary);
          color: var(--color-text-inverse);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: var(--transition-base);
          box-shadow: var(--shadow-base);
          font-family: var(--font-sans);
        }

        .btn:hover {
          background: var(--color-primary-dark);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 3px;
        }

        .btn-icon {
          width: 24px;
          height: 24px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-top: var(--space-8);
          text-align: left;
        }

        .feature {
          display: flex;
          align-items: start;
          gap: var(--space-3);
        }

        .feature-icon {
          width: 20px;
          height: 20px;
          color: var(--color-success);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .feature-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        @media (max-width: 639px) {
          .btn {
            width: 100%;
          }
        }
      </style>

      <div class="mode-panel" role="tabpanel" id="hourly-panel" aria-labelledby="hourly-tab">
        <div class="panel-header">
          <h2 class="panel-title">Hourly Bells</h2>
          <p class="panel-description">
            A simple, reliable reminder that rings at the top of every hour,
            helping you maintain mindfulness throughout your day.
          </p>
        </div>

        <svg class="bell-illustration" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>

        <div class="next-bell-info">
          <div class="next-label">Next Bell At</div>
          <div class="next-time">${nextHour}</div>
        </div>

        <button
          class="btn"
          data-action="start-hourly"
          aria-label="Start hourly bell schedule"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Start Hourly Bells</span>
        </button>

        <div class="features">
          <div class="feature">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="feature-text">
              <strong>Simple & Predictable:</strong> No configuration needed—bells ring every hour, on the hour
            </span>
          </div>
          <div class="feature">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="feature-text">
              <strong>Continuous Practice:</strong> Perfect for maintaining awareness during long work sessions
            </span>
          </div>
          <div class="feature">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span class="feature-text">
              <strong>Gentle Anchor:</strong> Regular reminders help build a consistent mindfulness habit
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('hourly-mode-panel', HourlyModePanel);
