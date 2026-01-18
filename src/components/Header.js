/**
 * Header Component
 * 
 * Application header with app title, lotus icon, and live clock display.
 */

export class Header extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.clockInterval = null;
  }

  connectedCallback() {
    this.render();
    this.startClock();
  }

  disconnectedCallback() {
    this.stopClock();
  }

  startClock() {
    // Update immediately
    this.updateClock();
    
    // Update every second
    this.clockInterval = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  updateClock() {
    if (!this.shadowRoot) return;
    
    const now = new Date();
    const timeElement = this.shadowRoot.querySelector('.current-time');
    const dateElement = this.shadowRoot.querySelector('.current-date');
    
    if (timeElement) {
      timeElement.textContent = this.formatTime(now);
    }
    
    if (dateElement) {
      dateElement.textContent = this.formatDate(now);
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-6);
          gap: var(--space-6);
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex: 1;
          min-width: 200px;
        }

        .app-icon {
          width: 48px;
          height: 48px;
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .app-title {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .app-name {
          font-family: var(--font-serif);
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-normal);
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1;
        }

        .app-tagline {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          font-style: italic;
        }

        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-1);
          min-width: 160px;
        }

        .current-time {
          font-family: var(--font-mono);
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-medium);
          color: var(--color-primary);
          line-height: 1;
          letter-spacing: var(--letter-spacing-wide);
          font-variant-numeric: tabular-nums;
        }

        .current-date {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          text-align: right;
        }

        /* Responsive adjustments */
        @media (max-width: 639px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-4);
          }

          .header-right {
            align-items: flex-start;
            width: 100%;
          }

          .current-date {
            text-align: left;
          }
        }

        @media (min-width: 1024px) {
          .header {
            padding: var(--space-6) var(--space-8);
          }

          .app-name {
            font-size: var(--font-size-3xl);
          }
        }
      </style>

      <header class="header">
        <div class="header-left">
          <svg class="app-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Lotus flower icon -->
            <path d="M24 8C24 8 18 12 18 20C18 24 20 26 24 28C28 26 30 24 30 20C30 12 24 8 24 8Z" fill="currentColor" opacity="0.3"/>
            <path d="M12 20C12 20 10 24 12 30C14 34 18 36 24 36C30 36 34 34 36 30C38 24 36 20 36 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M24 28C24 28 20 32 20 38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M24 28C24 28 28 32 28 38" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="24" cy="20" r="3" fill="currentColor"/>
          </svg>
          
          <div class="app-title">
            <h1 class="app-name">Awakening Bell</h1>
            <p class="app-tagline">Mindful breathing companion</p>
          </div>
        </div>

        <div class="header-right">
          <time class="current-time" aria-label="Current time">--:--:--</time>
          <div class="current-date" aria-label="Current date">Loading...</div>
        </div>
      </header>
    `;
  }
}

// Register the custom element
customElements.define('app-header', Header);
