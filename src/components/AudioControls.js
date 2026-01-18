/**
 * AudioControls Component
 * 
 * Controls for managing audio volume, muting, and bell previews.
 * Configurable and accessible with visual feedback.
 */

export class AudioControls extends HTMLElement {
  static get observedAttributes() {
    return ['volume', 'muted'];
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
      this.updateControl(name, newValue);
    }
  }

  updateControl(name, value) {
    if (!this.shadowRoot) return;

    if (name === 'volume') {
      const slider = this.shadowRoot.querySelector('#volume-slider');
      const display = this.shadowRoot.querySelector('.volume-value');
      if (slider instanceof HTMLInputElement) {
        slider.value = value || '70';
      }
      if (display) {
        display.textContent = `${value || '70'}%`;
      }
    } else if (name === 'muted') {
      const button = this.shadowRoot.querySelector('[data-action="toggle-mute"]');
      const isMuted = value === 'true';
      if (button) {
        button.setAttribute('aria-pressed', String(isMuted));
        button.classList.toggle('active', isMuted);
      }
    }
  }

  setupEventListeners() {
    this.shadowRoot?.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const button = target.closest('button');
      if (!button || !button.dataset.action) return;

      e.preventDefault();

      this.dispatchEvent(new CustomEvent('audio-action', {
        detail: { action: button.dataset.action, bellType: button.dataset.bellType },
        bubbles: true,
        composed: true
      }));
    });

    const slider = this.shadowRoot?.querySelector('#volume-slider');
    if (slider instanceof HTMLInputElement) {
      slider.addEventListener('input', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        const volume = parseInt(target.value, 10);
        this.setAttribute('volume', String(volume));

        this.dispatchEvent(new CustomEvent('volume-change', {
          detail: { volume },
          bubbles: true,
          composed: true
        }));
      });
    }
  }

  render() {
    if (!this.shadowRoot) return;

    const volume = parseInt(this.getAttribute('volume') || '70', 10);
    const muted = this.getAttribute('muted') === 'true';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .audio-controls {
          background: var(--color-bg-elevated);
          border-radius: var(--radius-lg);
          padding: var(--space-6);
          box-shadow: var(--shadow-sm);
        }

        .controls-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin-bottom: var(--space-4);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .title-icon {
          width: 20px;
          height: 20px;
          color: var(--color-primary);
        }

        .volume-control {
          margin-bottom: var(--space-6);
        }

        .volume-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .volume-value {
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary);
          font-family: var(--font-mono);
        }

        .volume-slider-container {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .volume-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--color-neutral-200);
          border-radius: var(--radius-full);
          outline: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-base);
        }

        .volume-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          border: none;
          transition: var(--transition-base);
        }

        .volume-slider:hover::-webkit-slider-thumb {
          background: var(--color-primary-dark);
          transform: scale(1.1);
        }

        .volume-slider:hover::-moz-range-thumb {
          background: var(--color-primary-dark);
          transform: scale(1.1);
        }

        .volume-slider:focus-visible {
          box-shadow: var(--shadow-focus);
        }

        .volume-icon {
          width: 20px;
          height: 20px;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .button-group {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: var(--button-height);
          padding: var(--space-3) var(--space-4);
          background: var(--color-neutral-200);
          color: var(--color-text-primary);
          border: none;
          border-radius: var(--radius-base);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: var(--transition-base);
          font-family: var(--font-sans);
        }

        .btn:hover {
          background: var(--color-neutral-300);
        }

        .btn:active {
          transform: scale(0.98);
        }

        .btn:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
        }

        .btn.active {
          background: var(--color-primary);
          color: var(--color-text-inverse);
        }

        .btn-icon {
          width: 18px;
          height: 18px;
        }

        .preview-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }

        .preview-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-2);
        }

        @media (max-width: 639px) {
          .preview-buttons {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="audio-controls">
        <h3 class="controls-title">
          <svg class="title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
          Audio Settings
        </h3>

        <!-- Volume Control -->
        <div class="volume-control">
          <div class="volume-label">
            <label for="volume-slider">Volume</label>
            <span class="volume-value">${volume}%</span>
          </div>
          <div class="volume-slider-container">
            <svg class="volume-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            </svg>
            <input
              type="range"
              id="volume-slider"
              class="volume-slider"
              min="0"
              max="100"
              value="${volume}"
              step="5"
              aria-label="Adjust volume"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${volume}"
              aria-valuetext="${volume} percent"
            />
            <svg class="volume-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </div>
        </div>

        <!-- Mute Toggle -->
        <div class="button-group">
          <button
            class="btn ${muted ? 'active' : ''}"
            data-action="toggle-mute"
            aria-pressed="${muted}"
            aria-label="${muted ? 'Unmute audio' : 'Mute audio'}"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              ${muted ? `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              ` : `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              `}
            </svg>
            <span>${muted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        <!-- Bell Preview Buttons -->
        <div>
          <div class="preview-label">Preview Bells</div>
          <div class="preview-buttons">
            <button
              class="btn"
              data-action="preview-bell"
              data-bell-type="small"
              aria-label="Preview small bell sound"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Small Bell</span>
            </button>
            <button
              class="btn"
              data-action="preview-bell"
              data-bell-type="big"
              aria-label="Preview big bell sound"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                <circle cx="18" cy="8" r="3" fill="currentColor"/>
              </svg>
              <span>Big Bell</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('audio-controls', AudioControls);
