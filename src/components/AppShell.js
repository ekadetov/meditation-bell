/**
 * AppShell Component
 * 
 * Main application container providing the overall layout structure.
 * Implements a responsive grid layout with header, tabbed navigation, main content, and footer.
 */

export class AppShell extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentTab = 'meditate';
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.loadActiveTab();
  }

  /**
   * Load active tab from sessionStorage
   */
  loadActiveTab() {
    const savedTab = sessionStorage.getItem('activeTab');
    if (savedTab && ['meditate', 'stats', 'history', 'privacy'].includes(savedTab)) {
      this.switchTab(savedTab);
    }
  }

  /**
   * Switch to a different tab
   * @param {string} tabName - Tab identifier
   */
  switchTab(tabName) {
    if (!this.shadowRoot) return;
    
    this.currentTab = tabName;
    sessionStorage.setItem('activeTab', tabName);
    
    // Update tab buttons
    const tabs = this.shadowRoot.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
      if (!(tab instanceof HTMLElement)) return;
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive.toString());
    });
    
    // Update content visibility
    const contents = this.shadowRoot.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (!(content instanceof HTMLElement)) return;
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
    
    // Dispatch tab change event
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: { tab: tabName },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Attach event listeners to tab buttons
   */
  attachEventListeners() {
    if (!this.shadowRoot) return;
    
    const tabs = this.shadowRoot.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        if (tab instanceof HTMLElement && tab.dataset.tab) {
          this.switchTab(tab.dataset.tab);
        }
      });
    });
  }

  render() {
    if (!this.shadowRoot) return;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
        }

        .app-shell {
          display: grid;
          grid-template-areas:
            "header"
            "tabs"
            "main"
            "footer";
          grid-template-rows: auto auto 1fr auto;
          grid-template-columns: 1fr;
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            var(--color-bg-primary) 0%,
            var(--color-neutral-100) 100%
          );
        }

        .app-header {
          grid-area: header;
          background: var(--color-bg-elevated);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
        }

        /* Tab Navigation */
        .tab-nav {
          grid-area: tabs;
          background: var(--color-bg-elevated);
          border-bottom: 2px solid var(--color-border-light);
          position: sticky;
          top: 60px; /* Adjust based on header height */
          z-index: calc(var(--z-sticky) - 1);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          min-width: min-content;
        }

        .tab-button {
          flex: 1;
          min-width: max-content;
          padding: var(--space-3) var(--space-5);
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--duration-base) var(--ease-out);
          white-space: nowrap;
        }

        .tab-button:hover {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
        }

        .tab-button:focus {
          outline: 2px solid var(--color-focus);
          outline-offset: -2px;
        }

        .tab-button.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          background: var(--color-bg-primary);
        }

        .tab-icon {
          margin-right: var(--space-2);
          font-size: var(--font-size-base);
        }

        .app-main {
          grid-area: main;
          padding: var(--space-6) var(--space-4);
          max-width: var(--container-xl);
          width: 100%;
          margin: 0 auto;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .app-footer {
          grid-area: footer;
          background: var(--color-bg-secondary);
          border-top: 1px solid var(--color-border-light);
        }

        /* Responsive adjustments */
        @media (min-width: 640px) {
          .app-main {
            padding: var(--space-8) var(--space-6);
          }

          .tab-button {
            font-size: var(--font-size-base);
            padding: var(--space-4) var(--space-6);
          }
        }

        @media (min-width: 1024px) {
          .app-main {
            padding: var(--space-12) var(--space-8);
          }
        }

        /* Skip link for accessibility */
        .skip-link {
          position: absolute;
          top: -100px;
          left: var(--space-4);
          background: var(--color-primary);
          color: var(--color-text-inverse);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-base);
          font-weight: var(--font-weight-medium);
          text-decoration: none;
          z-index: var(--z-tooltip);
          transition: top var(--duration-fast) var(--ease-out);
        }

        .skip-link:focus {
          top: var(--space-4);
          outline: 2px solid var(--color-focus);
          outline-offset: 2px;
        }
      </style>

      <div class="app-shell">
        <a href="#main-content" class="skip-link">Skip to main content</a>
        
        <header class="app-header">
          <slot name="header"></slot>
        </header>

        <nav class="tab-nav" role="tablist" aria-label="Main navigation">
          <ul class="tab-list">
            <li role="presentation">
              <button class="tab-button active" 
                      data-tab="meditate" 
                      role="tab" 
                      aria-selected="true"
                      aria-controls="tab-meditate">
                <span class="tab-icon">🧘</span>
                Meditate
              </button>
            </li>
            <li role="presentation">
              <button class="tab-button" 
                      data-tab="stats" 
                      role="tab" 
                      aria-selected="false"
                      aria-controls="tab-stats">
                <span class="tab-icon">📊</span>
                Stats & Insights
              </button>
            </li>
            <li role="presentation">
              <button class="tab-button" 
                      data-tab="history" 
                      role="tab" 
                      aria-selected="false"
                      aria-controls="tab-history">
                <span class="tab-icon">📜</span>
                History
              </button>
            </li>
            <li role="presentation">
              <button class="tab-button" 
                      data-tab="privacy" 
                      role="tab" 
                      aria-selected="false"
                      aria-controls="tab-privacy">
                <span class="tab-icon">🔒</span>
                Privacy
              </button>
            </li>
          </ul>
        </nav>

        <main id="main-content" class="app-main" role="main">
          <div class="tab-content active" data-tab="meditate" id="tab-meditate" role="tabpanel">
            <slot name="meditate"></slot>
          </div>
          <div class="tab-content" data-tab="stats" id="tab-stats" role="tabpanel">
            <slot name="stats"></slot>
          </div>
          <div class="tab-content" data-tab="history" id="tab-history" role="tabpanel">
            <slot name="history"></slot>
          </div>
          <div class="tab-content" data-tab="privacy" id="tab-privacy" role="tabpanel">
            <slot name="privacy"></slot>
          </div>
        </main>

        <footer class="app-footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('app-shell', AppShell);
