/**
 * ModeSelector Component
 * 
 * Tab navigation for switching between timer modes.
 * Supports keyboard navigation and ARIA attributes.
 */

export class ModeSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentMode = 'periodic';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const tablist = this.shadowRoot?.querySelector('[role="tablist"]');
    if (!tablist) return;

    // Handle tab clicks
    tablist.addEventListener('click', (e) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;
      
      const tab = target.closest('[role="tab"]');
      if (tab && tab instanceof HTMLElement && tab.dataset.mode) {
        this.selectTab(tab.dataset.mode);
      }
    });

    // Handle keyboard navigation
    tablist.addEventListener('keydown', (e) => {
      if (!(e instanceof KeyboardEvent)) return;
      
      const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
      const currentIndex = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab && nextTab instanceof HTMLElement && nextTab.dataset.mode) {
        this.selectTab(nextTab.dataset.mode);
        nextTab.focus();
      }
    });
  }

  selectTab(mode) {
    if (this.currentMode === mode) return;

    this.currentMode = mode;
    this.updateTabs();

    // Dispatch custom event for mode change
    this.dispatchEvent(new CustomEvent('mode-change', {
      detail: { mode },
      bubbles: true,
      composed: true
    }));
  }

  updateTabs() {
    const tabs = this.shadowRoot?.querySelectorAll('[role="tab"]');
    if (!tabs) return;

    tabs.forEach(tab => {
      if (!(tab instanceof HTMLElement) || !tab.dataset.mode) return;
      
      const isSelected = tab.dataset.mode === this.currentMode;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });
  }

  render() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .mode-selector {
          margin-bottom: var(--space-8);
        }

        .tablist {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-2);
          background: var(--color-neutral-200);
          padding: var(--space-2);
          border-radius: var(--radius-lg);
        }

        .tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          min-height: var(--touch-target-min);
          padding: var(--space-3) var(--space-4);
          background: transparent;
          border: none;
          border-radius: var(--radius-base);
          font-family: var(--font-sans);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: var(--transition-base);
          position: relative;
        }

        .tab:hover {
          background: var(--color-neutral-100);
          color: var(--color-text-primary);
        }

        .tab[aria-selected="true"] {
          background: var(--color-bg-elevated);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .tab:focus-visible {
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
          z-index: 1;
        }

        .tab-icon {
          width: 24px;
          height: 24px;
          stroke-width: 2px;
        }

        .tab-label {
          font-size: var(--font-size-sm);
          line-height: 1;
        }

        @media (max-width: 639px) {
          .tablist {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .tablist {
            grid-template-columns: repeat(4, 1fr);
          }

          .tab {
            padding: var(--space-4) var(--space-5);
          }

          .tab-icon {
            width: 28px;
            height: 28px;
          }

          .tab-label {
            font-size: var(--font-size-base);
          }
        }
      </style>

      <nav class="mode-selector" aria-label="Timer modes">
        <div class="tablist" role="tablist">
          <button
            role="tab"
            aria-selected="true"
            aria-controls="periodic-panel"
            data-mode="periodic"
            tabindex="0"
            class="tab"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span class="tab-label">Periodic</span>
          </button>

          <button
            role="tab"
            aria-selected="false"
            aria-controls="random-panel"
            data-mode="random"
            tabindex="-1"
            class="tab"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            <span class="tab-label">Random</span>
          </button>

          <button
            role="tab"
            aria-selected="false"
            aria-controls="reminder-panel"
            data-mode="reminder"
            tabindex="-1"
            class="tab"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="tab-label">Reminder</span>
          </button>

          <button
            role="tab"
            aria-selected="false"
            aria-controls="hourly-panel"
            data-mode="hourly"
            tabindex="-1"
            class="tab"
          >
            <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12"/>
              <line x1="12" y1="12" x2="16" y2="12"/>
            </svg>
            <span class="tab-label">Hourly</span>
          </button>
        </div>
      </nav>
    `;

    this.updateTabs();
  }
}

// Register the custom element
customElements.define('mode-selector', ModeSelector);
