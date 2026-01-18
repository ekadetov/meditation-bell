/**
 * ControlButtons Component
 * 
 * Primary action buttons for controlling the timer (Start/Pause/Resume/Stop).
 * Large, touch-friendly buttons with clear visual states.
 */

export class ControlButtons extends HTMLElement {
  static get observedAttributes() {
    return ['status'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupEventListeners() {
    this.shadowRoot?.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      
      const button = target.closest('button');
      if (!button || !button.dataset.action) return;

      e.preventDefault();
      
      this.dispatchEvent(new CustomEvent('control-action', {
        detail: { action: button.dataset.action },
        bubbles: true,
        composed: true
      }));
    });
  }

  render() {
    if (!this.shadowRoot) return;

    const status = this.getAttribute('status') || 'idle';
    
    // Determine which buttons to show based on status
    const showStart = status === 'idle' || status === 'stopped';
    const showPause = status === 'running';
    const showResume = status === 'paused';
    const showStop = status === 'running' || status === 'paused';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .control-buttons {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          align-items: center;
          padding: var(--space-6) 0;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          min-height: var(--button-height-lg);
          min-width: 160px;
          padding: var(--space-4) var(--space-8);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: var(--transition-base);
          font-family: var(--font-sans);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn:not(:disabled):active {
          transform: translateY(0);
        }

        .btn:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 3px;
        }

        .btn-primary {
          background: var(--color-primary);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-base);
        }

        .btn-primary:not(:disabled):hover {
          background: var(--color-primary-dark);
        }

        .btn-secondary {
          background: var(--color-neutral-200);
          color: var(--color-text-primary);
          box-shadow: var(--shadow-sm);
        }

        .btn-secondary:not(:disabled):hover {
          background: var(--color-neutral-300);
        }

        .btn-warning {
          background: var(--color-warning);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-base);
        }

        .btn-warning:not(:disabled):hover {
          background: var(--color-warning-dark);
        }

        .btn-success {
          background: var(--color-success);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-base);
        }

        .btn-success:not(:disabled):hover {
          background: var(--color-success-light);
        }

        .btn-icon {
          width: 24px;
          height: 24px;
          stroke-width: 2.5px;
        }

        .hidden {
          display: none;
        }

        @media (max-width: 639px) {
          .control-buttons {
            flex-direction: column;
            gap: var(--space-3);
          }

          .btn {
            width: 100%;
            max-width: 280px;
          }
        }

        /* Animation for button appearance */
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn {
          animation: slideUp 300ms ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .btn {
            animation: none;
          }
        }
      </style>

      <div class="control-buttons" role="group" aria-label="Timer controls">
        <!-- Start Button -->
        <button
          class="btn btn-primary ${showStart ? '' : 'hidden'}"
          data-action="start"
          aria-label="Start meditation timer"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Start</span>
        </button>

        <!-- Pause Button -->
        <button
          class="btn btn-warning ${showPause ? '' : 'hidden'}"
          data-action="pause"
          aria-label="Pause meditation timer"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span>Pause</span>
        </button>

        <!-- Resume Button -->
        <button
          class="btn btn-success ${showResume ? '' : 'hidden'}"
          data-action="resume"
          aria-label="Resume meditation timer"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Resume</span>
        </button>

        <!-- Stop Button -->
        <button
          class="btn btn-secondary ${showStop ? '' : 'hidden'}"
          data-action="stop"
          aria-label="Stop meditation timer"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
          <span>Stop</span>
        </button>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('control-buttons', ControlButtons);
