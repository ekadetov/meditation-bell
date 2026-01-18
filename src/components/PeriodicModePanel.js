/**
 * PeriodicModePanel Component
 * 
 * Configuration panel for periodic timer mode.
 * Allows setting small and big bell intervals with validation.
 */

export class PeriodicModePanel extends HTMLElement {
/**
 * No code is needed at this placeholder. The class body starts here.
 * All methods and logic are already defined below.
 */
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
      const smallIntervalStr = formData.get('small-interval');
      const bigIntervalStr = formData.get('big-interval');
      
      if (!smallIntervalStr || !bigIntervalStr) {
        this.showError('Please fill in all fields');
        return;
      }
      
      const smallInterval = parseInt(String(smallIntervalStr), 10);
      const bigInterval = parseInt(String(bigIntervalStr), 10);

      // Validation
      if (isNaN(smallInterval) || smallInterval < 1 || smallInterval > 1440) {
        this.showError('Small bell interval must be between 1 and 1440 minutes');
        return;
      }

      if (isNaN(bigInterval) || bigInterval < 1 || bigInterval > 1440) {
        this.showError('Big bell interval must be between 1 and 1440 minutes');
        return;
      }

      if (bigInterval < smallInterval) {
        this.showError('Big bell interval must be greater than or equal to small bell interval');
        return;
      }

      this.clearError();

      this.dispatchEvent(new CustomEvent('mode-config', {
        detail: {
          mode: 'periodic',
          config: { smallInterval, bigInterval }
        },
        bubbles: true,
        composed: true
      }));
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      input.addEventListener('input', () => this.clearError());
    });
  }

  showError(message) {
    const errorEl = this.shadowRoot?.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      errorEl.classList.add('shake');
      setTimeout(() => errorEl.classList.remove('shake'), 400);
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

        .form-input::placeholder {
          color: var(--color-text-tertiary);
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
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .error-message.hidden {
          display: none;
        }

        .error-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        .shake {
          animation: shake 400ms ease-in-out;
        }

        .example-box {
          background: var(--color-secondary-subtle);
          border-left: 3px solid var(--color-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-base);
          margin-top: var(--space-6);
        }

        .example-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-secondary-dark);
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

        @media (prefers-reduced-motion: reduce) {
          .shake {
            animation: none;
          }
        }
      </style>

      <div class="mode-panel" role="tabpanel" id="periodic-panel" aria-labelledby="periodic-tab">
        <div class="panel-header">
          <h2 class="panel-title">Periodic Bells</h2>
          <p class="panel-description">
            Set regular intervals for mindfulness reminders. The small bell rings at shorter
            intervals, while the big bell rings at longer intervals.
          </p>
        </div>

        <form>
          <div class="form-grid">
            <div class="form-group">
              <label for="small-interval" class="form-label">
                Small Bell Interval
              </label>
              <div class="input-suffix">
                <input
                  type="number"
                  id="small-interval"
                  name="small-interval"
                  class="form-input"
                  min="1"
                  max="1440"
                  value="5"
                  required
                  aria-describedby="small-help"
                />
                <span class="suffix-text">minutes</span>
              </div>
              <span id="small-help" class="form-help">
                Frequency of gentle reminder bells (1-1440 minutes)
              </span>
            </div>

            <div class="form-group">
              <label for="big-interval" class="form-label">
                Big Bell Interval
              </label>
              <div class="input-suffix">
                <input
                  type="number"
                  id="big-interval"
                  name="big-interval"
                  class="form-input"
                  min="1"
                  max="1440"
                  value="15"
                  required
                  aria-describedby="big-help"
                />
                <span class="suffix-text">minutes</span>
              </div>
              <span id="big-help" class="form-help">
                Frequency of deeper meditation bells (1-1440 minutes)
              </span>
            </div>
          </div>

          <div class="error-message hidden" role="alert" aria-live="polite">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Error message placeholder</span>
          </div>

          <div class="example-box">
            <div class="example-title">Example</div>
            <p class="example-text">
              With a 5-minute small bell and 15-minute big bell, you'll hear:<br>
              5 min: Small bell • 10 min: Small bell • 15 min: Big bell • 20 min: Small bell...
            </p>
          </div>
        </form>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('periodic-mode-panel', PeriodicModePanel);
