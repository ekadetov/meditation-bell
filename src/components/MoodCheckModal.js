/**
 * MoodCheckModal Component
 * 
 * Modal overlay for pre/post-session mood tracking.
 * Features emoji picker, optional slider, skip option, and full accessibility.
 */

import { MOOD_EMOJIS, MOOD_LABELS } from '../ai/MoodTracker.js';

export class MoodCheckModal extends HTMLElement {
  #handleTabKey = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.moodValue = null;
    this.isClosed = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.trapFocus();
  }

  disconnectedCallback() {
    this.#removeFocusTrap();
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Emoji buttons
    this.shadowRoot.querySelectorAll('.mood-emoji').forEach((btn, idx) => {
      btn.addEventListener('click', () => this.selectMood(idx + 1));
    });

    // Slider
    const slider = this.shadowRoot.querySelector('.mood-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value, 10);
        this.updateSliderDisplay(value);
      });
      slider.addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        this.selectMood(value);
      });
    }

    // Skip button
    this.shadowRoot.querySelector('.skip-btn')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('mood-skipped', {
        bubbles: true,
        composed: true
      }));
      this.close();
    });

    // Close on backdrop click
    this.shadowRoot.querySelector('.backdrop')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('backdrop')) {
        this.dispatchEvent(new CustomEvent('mood-skipped', {
          bubbles: true,
          composed: true
        }));
        this.close();
      }
    });

    // Keyboard navigation
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.dispatchEvent(new CustomEvent('mood-skipped', {
          bubbles: true,
          composed: true
        }));
        this.close();
      }
    });
  }

  /**
   * Update slider display with current emoji
   * @private
   * @param {number} value - Mood value (1-10)
   */
  updateSliderDisplay(value) {
    const display = this.shadowRoot.querySelector('.slider-value');
    if (display) {
      display.textContent = `${this.getEmoji(value)} ${value}`;
    }
  }

  /**
   * Select a mood value
   * @param {number} value - Mood value (1-10)
   */
  selectMood(value) {
    if (this.isClosed) return;
    
    this.moodValue = value;
    const emoji = this.getEmoji(value);
    const label = this.getLabel(value);
    
    this.dispatchEvent(new CustomEvent('mood-selected', {
      bubbles: true,
      composed: true,
      detail: { 
        mood: value,
        emoji,
        label
      }
    }));
    
    this.close();
  }

  /**
   * Get emoji for mood value
   * @param {number} value - Mood value (1-10)
   * @returns {string} Emoji character
   */
  getEmoji(value) {
    return MOOD_EMOJIS[value] || '😐';
  }

  /**
   * Get label for mood value
   * @param {number} value - Mood value (1-10)
   * @returns {string} Label text
   */
  getLabel(value) {
    return MOOD_LABELS[value] || 'Neutral';
  }

  /**
   * Close modal
   */
  close() {
    if (this.isClosed) return;
    this.isClosed = true;
    
    // Animate out
    const modal = this.shadowRoot.querySelector('.modal');
    const backdrop = this.shadowRoot.querySelector('.backdrop');
    
    if (modal) {
      modal.style.animation = 'slideOut 0.2s ease-in forwards';
    }
    if (backdrop) {
      backdrop.style.animation = 'fadeOut 0.2s ease-in forwards';
    }
    
    setTimeout(() => {
      this.remove();
    }, 200);
  }

  /**
   * Trap focus within modal for accessibility
   * @private
   */
  trapFocus() {
    const focusableElements = this.shadowRoot.querySelectorAll(
      'button:not([disabled]), input:not([disabled])'
    );
    
    if (focusableElements.length === 0) return;
    
    this.firstFocusable = focusableElements[0];
    this.lastFocusable = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    setTimeout(() => {
      this.firstFocusable?.focus();
    }, 100);
    
    this.#handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    };
    
    this.shadowRoot.addEventListener('keydown', this.#handleTabKey);
  }

  /**
   * Remove focus trap
   * @private
   */
  #removeFocusTrap() {
    if (this.#handleTabKey) {
      this.shadowRoot.removeEventListener('keydown', this.#handleTabKey);
    }
  }

  render() {
    const question = this.getAttribute('question') || 'How are you feeling?';
    const showSlider = this.getAttribute('show-slider') !== 'false';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }
        
        .backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--color-surface, #fff);
          border-radius: var(--radius-3, 12px);
          padding: var(--space-6, 2rem);
          max-width: 500px;
          width: 90%;
          box-shadow: var(--shadow-large, 0 20px 40px rgba(0,0,0,0.3));
          animation: slideIn 0.3s ease-out;
        }
        
        .question {
          font-size: 1.5rem;
          margin-bottom: var(--space-4, 1.5rem);
          text-align: center;
          color: var(--color-text-primary, #1a1a1a);
          font-family: var(--font-serif, serif);
        }
        
        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: var(--space-2, 0.5rem);
          margin-bottom: var(--space-4, 1.5rem);
        }
        
        .mood-emoji {
          font-size: 2rem;
          padding: var(--space-3, 1rem);
          border: 2px solid transparent;
          border-radius: var(--radius-2, 8px);
          background: var(--color-background, #fafafa);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: 1;
        }
        
        .mood-emoji:hover,
        .mood-emoji:focus {
          border-color: var(--color-primary, #2C5F7C);
          transform: scale(1.1);
          background: var(--color-primary-light, #e8f2f7);
          outline: none;
        }
        
        .mood-emoji:active {
          transform: scale(0.95);
        }
        
        .slider-section {
          margin-bottom: var(--space-4, 1.5rem);
          padding: var(--space-3, 1rem);
          background: var(--color-background, #fafafa);
          border-radius: var(--radius-2, 8px);
        }
        
        .slider-label {
          display: block;
          font-size: 0.875rem;
          color: var(--color-text-secondary, #666);
          margin-bottom: var(--space-2, 0.5rem);
          text-align: center;
        }
        
        .mood-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-border-light, #ddd);
          outline: none;
          -webkit-appearance: none;
          margin-bottom: var(--space-2, 0.5rem);
        }
        
        .mood-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-primary, #2C5F7C);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .mood-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-primary, #2C5F7C);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .mood-slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px var(--color-primary-light, #e8f2f7);
        }
        
        .mood-slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 4px var(--color-primary-light, #e8f2f7);
        }
        
        .slider-value {
          text-align: center;
          font-size: 1.5rem;
          font-weight: var(--font-weight-medium, 500);
          color: var(--color-text-primary, #1a1a1a);
        }
        
        .button-group {
          display: flex;
          justify-content: center;
          gap: var(--space-3, 1rem);
        }
        
        .skip-btn {
          padding: var(--space-2, 0.5rem) var(--space-4, 1.5rem);
          background: var(--color-text-tertiary, #999);
          color: white;
          border: none;
          border-radius: var(--radius-2, 8px);
          cursor: pointer;
          font-size: 1rem;
          font-weight: var(--font-weight-medium, 500);
          transition: all 0.2s ease;
        }
        
        .skip-btn:hover,
        .skip-btn:focus {
          background: var(--color-text-secondary, #666);
          outline: 2px solid var(--color-focus, #2C5F7C);
          outline-offset: 2px;
        }
        
        .skip-btn:active {
          transform: scale(0.98);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
          to {
            transform: translate(-50%, -55%);
            opacity: 0;
          }
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .modal {
            width: 95%;
            padding: var(--space-4, 1.5rem);
          }
          
          .question {
            font-size: 1.25rem;
          }
          
          .emoji-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: var(--space-1, 0.25rem);
          }
          
          .mood-emoji {
            font-size: 1.5rem;
            padding: var(--space-2, 0.5rem);
          }
        }
      </style>
      
      <div class="backdrop">
        <div class="modal" role="dialog" aria-labelledby="mood-question" aria-modal="true">
          <h2 id="mood-question" class="question">${question}</h2>
          
          <div class="emoji-grid" role="radiogroup" aria-label="Select your mood">
            ${Object.entries(MOOD_EMOJIS).map(([value, emoji]) => `
              <button 
                class="mood-emoji" 
                aria-label="${MOOD_LABELS[value]} - Level ${value}"
                role="radio"
                aria-checked="false"
              >
                ${emoji}
              </button>
            `).join('')}
          </div>
          
          ${showSlider ? `
            <div class="slider-section">
              <label class="slider-label" for="mood-slider">Or use the slider:</label>
              <input 
                type="range" 
                id="mood-slider"
                class="mood-slider" 
                min="1" 
                max="10" 
                value="5"
                aria-label="Mood level slider"
              >
              <div class="slider-value" aria-live="polite">${this.getEmoji(5)} 5</div>
            </div>
          ` : ''}
          
          <div class="button-group">
            <button class="skip-btn" aria-label="Skip mood tracking">Skip</button>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('mood-check-modal', MoodCheckModal);
