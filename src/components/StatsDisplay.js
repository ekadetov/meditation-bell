/**
 * StatsDisplay Component
 * 
 * Displays meditation statistics and visualizations.
 * Shows key metrics, weekly bar chart, and mood trend line.
 */

import { sessionStore } from '../storage/SessionStore.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

export class StatsDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.stats = null;
    this.sessions = [];
  }

  async connectedCallback() {
    await this.loadStats();
    this.render();
    
    // Listen for session updates
    eventBus.on(EVENTS.SESSION_SAVED, () => {
      this.loadStats();
    });
  }

  /**
   * Load statistics from store
   * @private
   */
  async loadStats() {
    try {
      this.stats = await sessionStore.getStatistics();
      this.sessions = await sessionStore.getAllSessions();
      this.sessions.sort((a, b) => b.startTime - a.startTime); // Newest first
      this.render();
    } catch (error) {
      console.error('[StatsDisplay] Failed to load stats:', error);
    }
  }

  /**
   * Format duration in hours and minutes
   * @private
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted time
   */
  formatTotalTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  /**
   * Format duration in minutes and seconds
   * @private
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted time
   */
  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get weekly session counts (last 7 days)
   * @private
   * @returns {Array} Array of {day, count, label}
   */
  getWeeklyData() {
    const now = new Date();
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = this.sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= date && sessionDate < nextDate;
      }).length;
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      data.push({
        day: i === 0 ? 'Today' : dayNames[date.getDay()],
        count,
        date: date.toISOString().split('T')[0]
      });
    }
    
    return data;
  }

  /**
   * Get mood trend data (last 14 sessions)
   * @private
   * @returns {Array} Array of {index, moodPre, moodPost}
   */
  getMoodTrendData() {
    const recentSessions = this.sessions
      .filter(s => s.moodPre && s.moodPost)
      .slice(0, 14)
      .reverse(); // Oldest first for chart
    
    return recentSessions.map((s, i) => ({
      index: i + 1,
      moodPre: s.moodPre.score,
      moodPost: s.moodPost.score
    }));
  }

  /**
   * Render weekly bar chart
   * @private
   * @param {Array} data - Weekly data
   * @returns {string} HTML for chart
   */
  renderWeeklyChart(data) {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    return `
      <div class="chart-container">
        <h3 class="chart-title">Weekly Activity</h3>
        <div class="bar-chart">
          ${data.map(d => `
            <div class="bar-group">
              <div class="bar-wrapper">
                <div 
                  class="bar" 
                  style="height: ${(d.count / maxCount) * 100}%"
                  data-count="${d.count}"
                ></div>
              </div>
              <div class="bar-label">${d.day}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render mood trend line chart
   * @private
   * @param {Array} data - Mood trend data
   * @returns {string} HTML for chart
   */
  renderMoodChart(data) {
    if (data.length === 0) {
      return `
        <div class="chart-container">
          <h3 class="chart-title">Mood Trend</h3>
          <div class="empty-chart">
            <p>Complete sessions with mood tracking to see your trend</p>
          </div>
        </div>
      `;
    }
    
    const width = 300;
    const height = 150;
    const padding = 20;
    
    const xScale = (width - 2 * padding) / (data.length - 1 || 1);
    const yScale = (height - 2 * padding) / 10; // 1-10 scale
    
    const createPath = (values) => {
      return data.map((d, i) => {
        const x = padding + i * xScale;
        const y = height - padding - (values[i] - 1) * yScale;
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      }).join(' ');
    };
    
    const preValues = data.map(d => d.moodPre);
    const postValues = data.map(d => d.moodPost);
    
    return `
      <div class="chart-container">
        <h3 class="chart-title">Mood Trend</h3>
        <svg class="line-chart" viewBox="0 0 ${width} ${height}">
          <!-- Grid lines -->
          ${[2, 4, 6, 8, 10].map(level => `
            <line 
              x1="${padding}" 
              y1="${height - padding - (level - 1) * yScale}" 
              x2="${width - padding}" 
              y2="${height - padding - (level - 1) * yScale}" 
              class="grid-line"
            />
          `).join('')}
          
          <!-- Pre-session line -->
          <path 
            d="${createPath(preValues)}" 
            class="mood-line pre-line"
          />
          
          <!-- Post-session line -->
          <path 
            d="${createPath(postValues)}" 
            class="mood-line post-line"
          />
          
          <!-- Data points -->
          ${data.map((d, i) => {
            const x = padding + i * xScale;
            const yPre = height - padding - (d.moodPre - 1) * yScale;
            const yPost = height - padding - (d.moodPost - 1) * yScale;
            return `
              <circle cx="${x}" cy="${yPre}" r="3" class="mood-point pre-point" />
              <circle cx="${x}" cy="${yPost}" r="3" class="mood-point post-point" />
            `;
          }).join('')}
        </svg>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color pre-color"></span> Before
          </span>
          <span class="legend-item">
            <span class="legend-color post-color"></span> After
          </span>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.stats) {
      this.shadowRoot.innerHTML = `
        <style>
          .loading {
            text-align: center;
            padding: var(--space-8, 3rem);
            color: var(--color-text-secondary, #666);
          }
        </style>
        <div class="loading">Loading statistics...</div>
      `;
      return;
    }
    
    const weeklyData = this.getWeeklyData();
    const moodData = this.getMoodTrendData();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .stats-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .stats-title {
          font-family: var(--font-serif, serif);
          font-size: 2rem;
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-6, 2rem);
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--space-4, 1.5rem);
          margin-bottom: var(--space-6, 2rem);
        }
        
        .metric-card {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-5, 1.75rem);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
          text-align: center;
          transition: all 0.2s ease;
        }
        
        .metric-card:hover {
          box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.15));
          transform: translateY(-2px);
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: var(--font-weight-bold, 700);
          color: var(--color-primary, #2C5F7C);
          margin-bottom: var(--space-2, 0.5rem);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2, 0.5rem);
        }
        
        .metric-icon {
          font-size: 1.5rem;
        }
        
        .metric-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
          font-weight: var(--font-weight-medium, 500);
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4, 1.5rem);
        }
        
        .chart-container {
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-5, 1.75rem);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.1));
        }
        
        .chart-title {
          font-size: 1.125rem;
          font-weight: var(--font-weight-semibold, 600);
          color: var(--color-text-primary, #1a1a1a);
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 150px;
          gap: var(--space-2, 0.5rem);
        }
        
        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2, 0.5rem);
        }
        
        .bar-wrapper {
          flex: 1;
          width: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        
        .bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(to top, var(--color-primary, #2C5F7C), var(--color-primary-light, #4A7C95));
          border-radius: var(--radius-1, 4px) var(--radius-1, 4px) 0 0;
          transition: all 0.3s ease;
          min-height: 4px;
          position: relative;
        }
        
        .bar:hover {
          background: linear-gradient(to top, var(--color-accent, #E67E22), var(--color-accent-light, #F39C4F));
        }
        
        .bar:hover::after {
          content: attr(data-count);
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-text-primary, #1a1a1a);
          color: white;
          padding: 2px 6px;
          border-radius: var(--radius-1, 4px);
          font-size: 0.75rem;
          white-space: nowrap;
        }
        
        .bar-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #666);
        }
        
        .line-chart {
          width: 100%;
          height: auto;
        }
        
        .grid-line {
          stroke: var(--color-border-light, #ddd);
          stroke-width: 1;
        }
        
        .mood-line {
          fill: none;
          stroke-width: 2;
        }
        
        .pre-line {
          stroke: var(--color-warning, #F39C12);
        }
        
        .post-line {
          stroke: var(--color-success, #27AE60);
        }
        
        .mood-point {
          stroke: white;
          stroke-width: 2;
        }
        
        .pre-point {
          fill: var(--color-warning, #F39C12);
        }
        
        .post-point {
          fill: var(--color-success, #27AE60);
        }
        
        .chart-legend {
          display: flex;
          gap: var(--space-4, 1.5rem);
          justify-content: center;
          margin-top: var(--space-3, 1rem);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .pre-color {
          background: var(--color-warning, #F39C12);
        }
        
        .post-color {
          background: var(--color-success, #27AE60);
        }
        
        .empty-chart {
          text-align: center;
          padding: var(--space-6, 2rem);
          color: var(--color-text-tertiary, #999);
        }
        
        @media (max-width: 640px) {
          .stats-title {
            font-size: 1.5rem;
          }
          
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .metric-value {
            font-size: 2rem;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
      
      <div class="stats-container">
        <h2 class="stats-title">Your Statistics</h2>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">
              ${this.stats.totalSessions || 0}
            </div>
            <div class="metric-label">Total Sessions</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">
              ${this.formatTotalTime(this.stats.totalMinutes * 60 || 0)}
            </div>
            <div class="metric-label">Total Time</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">
              <span class="metric-icon">🔥</span>
              ${this.stats.currentStreak || 0}
            </div>
            <div class="metric-label">Current Streak</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">
              ${this.stats.longestStreak || 0}
            </div>
            <div class="metric-label">Longest Streak</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">
              ${this.formatDuration(Math.floor(this.stats.avgDuration || 0))}
            </div>
            <div class="metric-label">Avg Session</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-value">
              +${(this.stats.avgMoodImprovement || 0).toFixed(1)}
            </div>
            <div class="metric-label">Avg Mood Boost</div>
          </div>
        </div>
        
        <div class="charts-grid">
          ${this.renderWeeklyChart(weeklyData)}
          ${this.renderMoodChart(moodData)}
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('stats-display', StatsDisplay);
