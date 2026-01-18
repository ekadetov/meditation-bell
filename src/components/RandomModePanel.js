/**
 * RandomModePanel Component
 * 
 * Configuration panel for random timer mode.
 * Allows setting min/max intervals for unpredictable bell timing.
 */

export class RandomModePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.shadowRoot?.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const minIntervalStr = formData.get('min-interval');
      const maxIntervalStr = formData.get('max-interval');
      
      if (!minIntervalStr || !maxIntervalStr) {
        this.showError('Please fill in all fields');
        return;
      }
      
      const minInterval = parseInt(String(minIntervalStr), 10);
      const maxInterval = parseInt(String(maxIntervalStr), 10);

      // Validation
      if (isNaN(minInterval) || minInterval < 1 || minInterval > 1440) {
        this.showError('Minimum interval must be between 1 and 1440 minutes');
        return;
      }

      if (isNaN(maxInterval) || maxInterval < 1 || maxInterval > 1440) {
        this.showError('Maximum interval must be between 1 and 1440 minutes');
        return;
      }

      if (maxInterval <= minInterval) {
        this.showError('Maximum interval must be greater than minimum interval');
        return;
      }

      this.clearError();

      this.dispatchEvent(new CustomEvent('mode-config', {
        detail: {
          mode: 'random',
          config: { minInterval, maxInterval }
        },
        bubbles: true,
        composed: true
      }));
    });
  }

  showError(message) {
    const errorEl = this.shadowRoot?.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  clearError() {
    const errorEl = this.shadowRoot?.querySelector('.error-message');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }

  render() {
    if (!this.shadowRoot) return;

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
        }

        .panel-header {
          margin-bottom: var(--space-6);
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
        }

        .form-group {
          margin-bottom: var(--space-5);
        }

        .form-label {
          display: block;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
          margin-bottom: var(--space-2);
        }

        .form-help {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
        }

        .form-input {
          width: 100%;
          min-height: var(--button-height);
          padding: var(--space-3) var(--space-4);
          background: var(--color-bg-primary);
          border: 2px solid var(--color-border-medium);
          border-radius: var(--radius-base);
          font-size: var(--font-size-base);
          font-family: var(--font-mono);
          color: var(--color-text-primary);
          transition: var(--transition-base);
        }

        .form-input:hover {
          border-color: var(--color-border-dark);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: var(--shadow-focus);
        }

        .input-suffix {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .input-suffix .form-input {
          flex: 1;
        }

        .suffix-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }

        .error-message {
          background: var(--color-error-light);
          color: var(--color-error);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-base);
          font-size: var(--font-size-sm);
          margin-top: var(--space-4);
        }

        .error-message.hidden {
          display: none;
        }

        .example-box {
          background: var(--color-accent-subtle);
          border-left: 3px solid var(--color-accent);
          padding: var(--space-4);
          border-radius: var(--radius-base);
          margin-top: var(--space-6);
        }

        .example-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-accent-dark);
          margin-bottom: var(--space-2);
        }

        .example-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: var(--line-height-relaxed);
        }

        @media (min-width: 768px) {
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-5);
          }

          .form-group {
            margin-bottom: 0;
          }
        }
      </style>

      <div class="mode-panel" role="tabpanel" id="random-panel" aria-labelledby="random-tab">
        <div class="panel-header">
          <h2 class="panel-title">Random Bells</h2>
          <p class="panel-description">
            Bells ring at unpredictable intervals within your specified range,
            bringing you back to the present moment when you least expect it.
          </p>
        </div>

        <form>
          <div class="form-grid">
            <div class="form-group">
              <label for="min-interval" class="form-label">
                Minimum Interval
              </label>
              <div class="input-suffix">
                <input
                  type="number"
                  id="min-interval"
                  name="min-interval"
                  class="form-input"
                  min="1"
                  max="1440"
                  value="3"
                  required
                  aria-describedby="min-help"
                />
                <span class="suffix-text">minutes</span>
              </div>
              <span id="min-help" class="form-help">
                Shortest possible interval between bells
              </span>
            </div>

            <div class="form-group">
              <label for="max-interval" class="form-label">
                Maximum Interval
              </label>
              <div class="input-suffix">
                <input
                  type="number"
                  id="max-interval"
                  name="max-interval"
                  class="form-input"
                  min="1"
                  max="1440"
                  value="10"
                  required
                  aria-describedby="max-help"
                />
                <span class="suffix-text">minutes</span>
              </div>
              <span id="max-help" class="form-help">
                Longest possible interval between bells
              </span>
            </div>
          </div>

          <div class="error-message hidden" role="alert" aria-live="polite"></div>

          <div class="example-box">
            <div class="example-title">Why Random?</div>
            <p class="example-text">
              Randomness prevents anticipation, making each bell a genuine surprise that
              gently returns your awareness to the present moment without creating expectation.
            </p>
          </div>
        </form>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('random-mode-panel', RandomModePanel);
