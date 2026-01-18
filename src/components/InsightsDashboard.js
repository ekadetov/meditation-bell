/**
 * InsightsDashboard Component
 * 
 * Displays AI-generated insights as attractive cards.
 * Supports categorization, filtering, and dismissal.
 */

import { insightsStore } from '../storage/InsightsStore.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

export class InsightsDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.insights = [];
    this.filter = 'all'; // 'all', 'pattern', 'suggestion', 'achievement', 'encouragement'
  }

  async connectedCallback() {
    await this.loadInsights();
    this.render();
    this.setupEventListeners();
    
    // Listen for new insights
    eventBus.on(EVENTS.INSIGHT_GENERATED, () => {
      this.loadInsights();
    });
  }

  /**
   * Load insights from store
   * @private
   */
  async loadInsights() {
    try {
      const allInsights = await insightsStore.getAllInsights();
      this.insights = allInsights
        .filter(insight => !insight.isDismissed)
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first
      this.render();
    } catch (error) {
      console.error('[InsightsDashboard] Failed to load insights:', error);
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Dismiss buttons
    this.shadowRoot.addEventListener('click', async (e) => {
      const target = e.target;
      
      if (target.classList.contains('dismiss-btn')) {
        const insightId = target.dataset.insightId;
        if (insightId) {
          await this.dismissInsight(insightId);
        }
      }
      
      // Filter tabs
      if (target.classList.contains('filter-tab')) {
        const filter = target.dataset.filter;
        if (filter) {
          this.filter = filter;
          this.render();
        }
      }
      
      // Mark as read
      if (target.closest('.insight-card')) {
        const card = target.closest('.insight-card');
        const insightId = card.dataset.insightId;
        const insight = this.insights.find(i => i.id === insightId);
        
        if (insight && !insight.isRead) {
          await insightsStore.markAsRead(insightId);
          card.classList.remove('unread');
          card.querySelector('.new-badge')?.remove();
        }
      }
    });
  }

  /**
   * Dismiss an insight
   * @private
   * @param {string} insightId - Insight ID
   */
  async dismissInsight(insightId) {
    try {
      await insightsStore.dismissInsight(insightId);
      this.insights = this.insights.filter(i => i.id !== insightId);
      this.render();
    } catch (error) {
      console.error('[InsightsDashboard] Failed to dismiss insight:', error);
    }
  }

  /**
   * Get icon for insight type
   * @private
   * @param {string} type - Insight type
   * @returns {string} Icon emoji
   */
  getIcon(type) {
    const icons = {
      pattern: '🔍',
      suggestion: '💡',
      achievement: '🏆',
      encouragement: '💪'
    };
    return icons[type] || '📝';
  }

  /**
   * Format timestamp as relative time
   * @private
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Relative time string
   */
  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  /**
   * Check if insight is new (< 24 hours)
   * @private
   * @param {number} timestamp - Unix timestamp
   * @returns {boolean} True if new
   */
  isNew(timestamp) {
    const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hours < 24;
  }

  /**
   * Get filtered insights
   * @private
   * @returns {Array} Filtered insights
   */
  getFilteredInsights() {
    if (this.filter === 'all') {
      return this.insights;
    }
    return this.insights.filter(i => i.type === this.filter);
  }

  /**
   * Get category counts
   * @private
   * @returns {Object} Counts by type
   */
  getCategoryCounts() {
    return {
      all: this.insights.length,
      pattern: this.insights.filter(i => i.type === 'pattern').length,
      suggestion: this.insights.filter(i => i.type === 'suggestion').length,
      achievement: this.insights.filter(i => i.type === 'achievement').length,
      encouragement: this.insights.filter(i => i.type === 'encouragement').length
    };
  }

  render() {
    const filteredInsights = this.getFilteredInsights();
    const counts = this.getCategoryCounts();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .dashboard {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          margin-bottom: var(--space-6, 2rem);
        }
        
        .dashboard-title {
          font-family: var(--font-serif, serif);
          font-size: 2rem;
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .filter-tabs {
          display: flex;
          gap: var(--space-2, 0.5rem);
          overflow-x: auto;
          padding-bottom: var(--space-2, 0.5rem);
        }
        
        .filter-tab {
          padding: var(--space-2, 0.5rem) var(--space-4, 1.5rem);
          background: var(--color-background, #fafafa);
          border: 2px solid transparent;
          border-radius: var(--radius-full, 999px);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-text-secondary, #666);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .filter-tab:hover {
          background: var(--color-primary-light, #e8f2f7);
          color: var(--color-primary, #2C5F7C);
        }
        
        .filter-tab.active {
          background: var(--color-primary, #2C5F7C);
          color: white;
          border-color: var(--color-primary, #2C5F7C);
        }
        
        .filter-tab .count {
          display: inline-block;
          margin-left: var(--space-1, 0.25rem);
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full, 999px);
          font-size: 0.75rem;
        }
        
        .insights-grid {
          display: grid;
          gap: var(--space-4, 1.5rem);
        }
        
        .insight-card {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-5, 1.75rem);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }
        
        .insight-card:hover {
          box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.15));
          transform: translateY(-2px);
        }
        
        .insight-card.unread {
          border: 2px solid var(--color-primary, #2C5F7C);
        }
        
        .insight-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3, 1rem);
          margin-bottom: var(--space-3, 1rem);
        }
        
        .insight-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }
        
        .insight-content {
          flex: 1;
        }
        
        .insight-title {
          font-size: 1.25rem;
          font-weight: var(--font-weight-semibold, 600);
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-2, 0.5rem);
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
        }
        
        .new-badge {
          display: inline-block;
          padding: 2px 8px;
          background: var(--color-accent, #E67E22);
          color: white;
          border-radius: var(--radius-full, 999px);
          font-size: 0.75rem;
          font-weight: var(--font-weight-bold, 700);
          text-transform: uppercase;
        }
        
        .insight-message {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--color-text-secondary, #666);
        }
        
        .insight-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-3, 1rem);
        }
        
        .insight-timestamp {
          font-size: 0.875rem;
          color: var(--color-text-tertiary, #999);
        }
        
        .dismiss-btn {
          padding: var(--space-1, 0.25rem) var(--space-3, 1rem);
          background: transparent;
          border: 1px solid var(--color-border-light, #ddd);
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
          transition: all 0.2s ease;
        }
        
        .dismiss-btn:hover {
          background: var(--color-error-light, #fee);
          border-color: var(--color-error, #dc3545);
          color: var(--color-error, #dc3545);
        }
        
        .empty-state {
          text-align: center;
          padding: var(--space-8, 3rem) var(--space-4, 1.5rem);
        }
        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .empty-title {
          font-size: 1.5rem;
          font-weight: var(--font-weight-semibold, 600);
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-2, 0.5rem);
        }
        
        .empty-message {
          font-size: 1rem;
          color: var(--color-text-secondary, #666);
        }
        
        @media (max-width: 640px) {
          .dashboard-title {
            font-size: 1.5rem;
          }
          
          .insight-card {
            padding: var(--space-4, 1.5rem);
          }
          
          .insight-header {
            gap: var(--space-2, 0.5rem);
          }
          
          .insight-icon {
            font-size: 1.5rem;
          }
          
          .insight-title {
            font-size: 1.125rem;
          }
        }
      </style>
      
      <div class="dashboard">
        <div class="dashboard-header">
          <h2 class="dashboard-title">Your Insights</h2>
          
          <div class="filter-tabs">
            <button 
              class="filter-tab ${this.filter === 'all' ? 'active' : ''}" 
              data-filter="all"
            >
              All <span class="count">${counts.all}</span>
            </button>
            <button 
              class="filter-tab ${this.filter === 'pattern' ? 'active' : ''}" 
              data-filter="pattern"
            >
              🔍 Patterns <span class="count">${counts.pattern}</span>
            </button>
            <button 
              class="filter-tab ${this.filter === 'suggestion' ? 'active' : ''}" 
              data-filter="suggestion"
            >
              💡 Suggestions <span class="count">${counts.suggestion}</span>
            </button>
            <button 
              class="filter-tab ${this.filter === 'achievement' ? 'active' : ''}" 
              data-filter="achievement"
            >
              🏆 Achievements <span class="count">${counts.achievement}</span>
            </button>
            <button 
              class="filter-tab ${this.filter === 'encouragement' ? 'active' : ''}" 
              data-filter="encouragement"
            >
              💪 Encouragement <span class="count">${counts.encouragement}</span>
            </button>
          </div>
        </div>
        
        ${filteredInsights.length > 0 ? `
          <div class="insights-grid">
            ${filteredInsights.map(insight => `
              <div 
                class="insight-card ${!insight.isRead ? 'unread' : ''}" 
                data-insight-id="${insight.id}"
              >
                <div class="insight-header">
                  <div class="insight-icon">${this.getIcon(insight.type)}</div>
                  <div class="insight-content">
                    <h3 class="insight-title">
                      ${insight.title}
                      ${this.isNew(insight.createdAt) ? '<span class="new-badge">New</span>' : ''}
                    </h3>
                    <p class="insight-message">${insight.message}</p>
                  </div>
                </div>
                <div class="insight-footer">
                  <span class="insight-timestamp">${this.formatTimestamp(insight.createdAt)}</span>
                  <button class="dismiss-btn" data-insight-id="${insight.id}">Dismiss</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">🧘</div>
            <h3 class="empty-title">Keep meditating to unlock insights!</h3>
            <p class="empty-message">
              Complete more meditation sessions to receive personalized insights about your practice.
            </p>
          </div>
        `}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('insights-dashboard', InsightsDashboard);
