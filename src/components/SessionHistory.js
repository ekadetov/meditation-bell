/**
 * SessionHistory Component
 * 
 * Displays past meditation sessions with filtering, sorting, and export capabilities.
 */

import { sessionStore } from '../storage/SessionStore.js';
import { dataPortability } from '../storage/DataPortability.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

export class SessionHistory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.sessions = [];
    this.filteredSessions = [];
    this.currentPage = 0;
    this.pageSize = 20;
    this.filterMode = 'all'; // 'all', 'periodic', 'random', 'reminder', 'hourly'
    this.dateRange = 'all'; // 'all', 'week', 'month', 'year'
    this.sortBy = 'date'; // 'date', 'duration', 'mood'
    this.sortDirection = 'desc'; // 'asc', 'desc'
  }

  async connectedCallback() {
    await this.loadSessions();
    this.render();
    this.setupEventListeners();
    
    // Listen for new sessions
    eventBus.on(EVENTS.SESSION_SAVED, () => {
      this.loadSessions();
    });
  }

  /**
   * Load sessions from store
   * @private
   */
  async loadSessions() {
    try {
      this.sessions = await sessionStore.getAllSessions();
      this.applyFilters();
      this.render();
    } catch (error) {
      console.error('[SessionHistory] Failed to load sessions:', error);
    }
  }

  /**
   * Apply filters and sorting
   * @private
   */
  applyFilters() {
    let filtered = [...this.sessions];
    
    // Mode filter
    if (this.filterMode !== 'all') {
      filtered = filtered.filter(s => s.mode === this.filterMode);
    }
    
    // Date range filter
    const now = Date.now();
    if (this.dateRange !== 'all') {
      const ranges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      const rangeMs = ranges[this.dateRange];
      filtered = filtered.filter(s => now - s.startTime < rangeMs);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = a.startTime - b.startTime;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'mood':
          comparison = (a.moodDelta || 0) - (b.moodDelta || 0);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    this.filteredSessions = filtered;
    this.currentPage = 0;
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    this.shadowRoot.addEventListener('click', async (e) => {
      const target = e.target;
      
      // Filter buttons
      if (target.classList.contains('filter-btn')) {
        const mode = target.dataset.mode;
        if (mode) {
          this.filterMode = mode;
          this.applyFilters();
          this.render();
        }
      }
      
      // Date range buttons
      if (target.classList.contains('range-btn')) {
        const range = target.dataset.range;
        if (range) {
          this.dateRange = range;
          this.applyFilters();
          this.render();
        }
      }
      
      // Sort buttons
      if (target.classList.contains('sort-btn')) {
        const sort = target.dataset.sort;
        if (sort) {
          if (this.sortBy === sort) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortBy = sort;
            this.sortDirection = 'desc';
          }
          this.applyFilters();
          this.render();
        }
      }
      
      // Export button
      if (target.classList.contains('export-btn')) {
        await this.exportToCSV();
      }
      
      // Load more button
      if (target.classList.contains('load-more-btn')) {
        this.currentPage++;
        this.render();
      }
    });
  }

  /**
   * Export sessions to CSV
   * @private
   */
  async exportToCSV() {
    try {
      await dataPortability.exportSessionsToCSV();
    } catch (error) {
      console.error('[SessionHistory] Failed to export CSV:', error);
      alert('Failed to export sessions. Please try again.');
    }
  }

  /**
   * Format timestamp
   * @private
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date/time
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format duration
   * @private
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get mode icon
   * @private
   * @param {string} mode - Mode name
   * @returns {string} Icon
   */
  getModeIcon(mode) {
    const icons = {
      periodic: '⏱️',
      random: '🎲',
      reminder: '🔔',
      hourly: '⏰'
    };
    return icons[mode] || '📿';
  }

  /**
   * Get mood change indicator
   * @private
   * @param {number} delta - Mood delta
   * @returns {string} Indicator HTML
   */
  getMoodIndicator(delta) {
    if (!delta) return '<span class="mood-neutral">—</span>';
    if (delta > 0) return `<span class="mood-positive">↑ +${delta}</span>`;
    return `<span class="mood-negative">↓ ${delta}</span>`;
  }

  /**
   * Get paginated sessions
   * @private
   * @returns {Array} Sessions for current page
   */
  getPaginatedSessions() {
    const start = 0;
    const end = (this.currentPage + 1) * this.pageSize;
    return this.filteredSessions.slice(start, end);
  }

  render() {
    const paginatedSessions = this.getPaginatedSessions();
    const hasMore = this.filteredSessions.length > paginatedSessions.length;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .history-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .history-header {
          margin-bottom: var(--space-6, 2rem);
        }
        
        .history-title {
          font-family: var(--font-serif, serif);
          font-size: 2rem;
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .controls-row {
          display: flex;
          gap: var(--space-4, 1.5rem);
          flex-wrap: wrap;
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .control-group {
          display: flex;
          gap: var(--space-2, 0.5rem);
          flex-wrap: wrap;
        }
        
        .control-label {
          font-size: 0.875rem;
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-text-secondary, #666);
          margin-bottom: var(--space-1, 0.25rem);
          width: 100%;
        }
        
        .filter-btn, .range-btn, .sort-btn {
          padding: var(--space-2, 0.5rem) var(--space-3, 1rem);
          background: var(--color-background, #fafafa);
          border: 2px solid transparent;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-text-secondary, #666);
          transition: all 0.2s ease;
        }
        
        .filter-btn:hover, .range-btn:hover, .sort-btn:hover {
          background: var(--color-primary-light, #e8f2f7);
          color: var(--color-primary, #2C5F7C);
        }
        
        .filter-btn.active, .range-btn.active, .sort-btn.active {
          background: var(--color-primary, #2C5F7C);
          color: white;
          border-color: var(--color-primary, #2C5F7C);
        }
        
        .sort-btn .arrow {
          margin-left: var(--space-1, 0.25rem);
        }
        
        .export-btn {
          padding: var(--space-2, 0.5rem) var(--space-4, 1.5rem);
          background: var(--color-success, #27AE60);
          color: white;
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
          margin-left: auto;
        }
        
        .export-btn:hover {
          background: var(--color-success-dark, #229954);
        }
        
        .sessions-table {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          overflow: hidden;
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: var(--color-primary, #2C5F7C);
          color: white;
        }
        
        th {
          padding: var(--space-3, 1rem);
          text-align: left;
          font-weight: var(--font-weight-semibold, 600);
          font-size: 0.875rem;
        }
        
        td {
          padding: var(--space-3, 1rem);
          border-top: 1px solid var(--color-border-light, #ddd);
        }
        
        tbody tr {
          transition: background 0.2s ease;
        }
        
        tbody tr:hover {
          background: var(--color-background, #fafafa);
        }
        
        .mode-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
          padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
          background: var(--color-background, #fafafa);
          border-radius: var(--radius-full, 999px);
          font-size: 0.875rem;
        }
        
        .mood-positive {
          color: var(--color-success, #27AE60);
          font-weight: var(--font-weight-semibold, 600);
        }
        
        .mood-negative {
          color: var(--color-error, #dc3545);
          font-weight: var(--font-weight-semibold, 600);
        }
        
        .mood-neutral {
          color: var(--color-text-tertiary, #999);
        }
        
        .load-more-container {
          text-align: center;
          padding: var(--space-6, 2rem);
        }
        
        .load-more-btn {
          padding: var(--space-3, 1rem) var(--space-6, 2rem);
          background: var(--color-primary, #2C5F7C);
          color: white;
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-size: 1rem;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
        }
        
        .load-more-btn:hover {
          background: var(--color-primary-dark, #1f4458);
          transform: translateY(-2px);
        }
        
        .empty-state {
          text-align: center;
          padding: var(--space-8, 3rem);
          color: var(--color-text-tertiary, #999);
        }
        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        @media (max-width: 768px) {
          .history-title {
            font-size: 1.5rem;
          }
          
          .controls-row {
            flex-direction: column;
          }
          
          .export-btn {
            margin-left: 0;
            width: 100%;
          }
          
          .sessions-table {
            overflow-x: auto;
          }
          
          table {
            min-width: 600px;
          }
          
          th, td {
            padding: var(--space-2, 0.5rem);
            font-size: 0.875rem;
          }
        }
      </style>
      
      <div class="history-container">
        <div class="history-header">
          <h2 class="history-title">Session History</h2>
          
          <div class="controls-row">
            <div class="control-group">
              <span class="control-label">Mode:</span>
              <button class="filter-btn ${this.filterMode === 'all' ? 'active' : ''}" data-mode="all">All</button>
              <button class="filter-btn ${this.filterMode === 'periodic' ? 'active' : ''}" data-mode="periodic">Periodic</button>
              <button class="filter-btn ${this.filterMode === 'random' ? 'active' : ''}" data-mode="random">Random</button>
              <button class="filter-btn ${this.filterMode === 'hourly' ? 'active' : ''}" data-mode="hourly">Hourly</button>
            </div>
            
            <div class="control-group">
              <span class="control-label">Range:</span>
              <button class="range-btn ${this.dateRange === 'all' ? 'active' : ''}" data-range="all">All Time</button>
              <button class="range-btn ${this.dateRange === 'week' ? 'active' : ''}" data-range="week">Week</button>
              <button class="range-btn ${this.dateRange === 'month' ? 'active' : ''}" data-range="month">Month</button>
              <button class="range-btn ${this.dateRange === 'year' ? 'active' : ''}" data-range="year">Year</button>
            </div>
            
            <button class="export-btn">📥 Export CSV</button>
          </div>
          
          <div class="control-group">
            <span class="control-label">Sort by:</span>
            <button class="sort-btn ${this.sortBy === 'date' ? 'active' : ''}" data-sort="date">
              Date <span class="arrow">${this.sortBy === 'date' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
            <button class="sort-btn ${this.sortBy === 'duration' ? 'active' : ''}" data-sort="duration">
              Duration <span class="arrow">${this.sortBy === 'duration' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
            <button class="sort-btn ${this.sortBy === 'mood' ? 'active' : ''}" data-sort="mood">
              Mood <span class="arrow">${this.sortBy === 'mood' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}</span>
            </button>
          </div>
        </div>
        
        ${paginatedSessions.length > 0 ? `
          <div class="sessions-table">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Mode</th>
                  <th>Bells</th>
                  <th>Mood Change</th>
                </tr>
              </thead>
              <tbody>
                ${paginatedSessions.map(session => `
                  <tr>
                    <td>${this.formatTimestamp(session.startTime)}</td>
                    <td>${this.formatDuration(session.duration)}</td>
                    <td>
                      <span class="mode-badge">
                        ${this.getModeIcon(session.mode)}
                        ${session.mode}
                      </span>
                    </td>
                    <td>${session.bellsRung || 0}</td>
                    <td>${this.getMoodIndicator(session.moodDelta)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          ${hasMore ? `
            <div class="load-more-container">
              <button class="load-more-btn">Load More</button>
            </div>
          ` : ''}
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📿</div>
            <p>No sessions found. Start meditating to build your history!</p>
          </div>
        `}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('session-history', SessionHistory);
