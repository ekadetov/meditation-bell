/**
 * TimerDisplay Component
 * 
 * Large timer display with breathing animation during active meditation.
 * Shows elapsed time, session status, and next bell countdown.
 */

export class TimerDisplay extends HTMLElement {
  static get observedAttributes() {
    return ['elapsed', 'status', 'next-bell', 'mode'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (window.eventBus && this.handleStateChange) {
      window.eventBus.off('STATE_CHANGED', this.handleStateChange);
    }
  }

  handleStateChange(state) {
    this.updateFromState(state);
  }

  setupEventListeners() {
    // Listen to state changes via EventBus
    window.eventBus?.on('STATE_CHANGED', this.handleStateChange);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  updateFromState(state) {
    if (!state?.timer) return;
    
    this.setAttribute('elapsed', String(state.timer.elapsed || 0));
    this.setAttribute('status', state.timer.status || 'idle');
    this.setAttribute('next-bell', String(state.timer.nextBellIn || 0));
    this.setAttribute('mode', state.timer.mode || '');
  }

  formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  getStatusLabel(status) {
    const labels = {
      idle: 'Ready to Begin',
      running: 'Meditating',
      paused: 'Paused',
      stopped: 'Session Complete'
    };
    return labels[status] || status;
  }

  getStatusColor(status) {
    const colors = {
      idle: 'var(--color-text-secondary)',
      running: 'var(--color-primary)',
      paused: 'var(--color-warning)',
      stopped: 'var(--color-success)'
    };
    return colors[status] || 'var(--color-text-secondary)';
  }

  render() {
    if (!this.shadowRoot) return;
    
    const elapsed = parseInt(this.getAttribute('elapsed') || '0', 10);
    const status = this.getAttribute('status') || 'idle';
    const nextBell = parseInt(this.getAttribute('next-bell') || '0', 10);
    const mode = this.getAttribute('mode') || '';
    
    const isActive = status === 'running';
    const statusLabel = this.getStatusLabel(status);
    const statusColor = this.getStatusColor(status);
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .timer-display {
          text-align: center;
          padding: var(--space-8) var(--space-4);
          margin: var(--space-6) 0;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: var(--color-bg-elevated);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
          color: ${statusColor};
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-6);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .status-indicator.active {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        .timer {
          font-family: var(--font-mono);
          font-size: var(--font-size-6xl);
          font-weight: var(--font-weight-light);
          font-variant-numeric: tabular-nums;
          color: var(--color-primary);
          margin: var(--space-6) 0;
          letter-spacing: var(--letter-spacing-wide);
          line-height: 1;
        }

        .timer.breathing {
          animation: breathe 4s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-top: var(--space-8);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .info-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--letter-spacing-wider);
        }

        .info-value {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .next-bell {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-6);
          background: var(--color-accent-subtle);
          color: var(--color-accent-dark);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-base);
          margin-top: var(--space-4);
        }

        .bell-icon {
          width: 20px;
          height: 20px;
        }

        @media (max-width: 639px) {
          .timer {
            font-size: var(--font-size-5xl);
          }
        }

        @media (min-width: 1024px) {
          .timer-display {
            padding: var(--space-12) var(--space-6);
          }

          .session-info {
            flex-direction: row;
            justify-content: center;
            gap: var(--space-12);
          }
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .timer.breathing {
            animation: none;
          }

          .status-indicator.active {
            animation: none;
            opacity: 1;
          }
        }
      </style>

      <div class="timer-display">
        <div class="status-badge">
          <span class="status-indicator ${isActive ? 'active' : ''}" aria-hidden="true"></span>
          <span>${statusLabel}</span>
        </div>

        <div 
          class="timer ${isActive ? 'breathing' : ''}"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Session elapsed time"
        >
          ${this.formatTime(elapsed)}
        </div>

        ${isActive && nextBell > 0 ? `
          <div class="next-bell" role="status" aria-live="polite">
            <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Next bell in ${this.formatTime(nextBell)}
          </div>
        ` : ''}

        ${status !== 'idle' ? `
          <div class="session-info">
            <div class="info-item">
              <span class="info-label">Session Time</span>
              <span class="info-value">${this.formatTime(elapsed)}</span>
            </div>
            ${mode ? `
              <div class="info-item">
                <span class="info-label">Mode</span>
                <span class="info-value">${mode}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('timer-display', TimerDisplay);
