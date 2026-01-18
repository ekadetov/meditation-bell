/**
 * Event Bus for application-wide communication
 * Implements a custom event system for loose coupling between components
 * @module core/EventBus
 */

/**
 * EventBus class provides a centralized event system
 * for component communication throughout the application
 */
export class EventBus {
  /**
   * Creates an EventBus instance
   */
  constructor() {
    /** @private {Map<string, Set<Function>>} Event listeners map */
    this.listeners = new Map();
    
    /** @private {Array<Function>} Middleware functions */
    this.middleware = [];
    
    /** @private {boolean} Enable development mode logging */
    this.devMode = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  }

  /**
   * Subscribe to an event
   * @param {string} eventType - The event type to listen for
   * @param {Function} callback - Function to call when event is dispatched
   * @returns {Function} Unsubscribe function
   * @throws {TypeError} If eventType is not a string or callback is not a function
   * 
   * @example
   * const unsubscribe = eventBus.on('TIMER_START', (data) => {
   *   console.log('Timer started:', data);
   * });
   * // Later: unsubscribe();
   */
  on(eventType, callback) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventType - The event type to stop listening to
   * @param {Function} callback - The callback function to remove
   * 
   * @example
   * eventBus.off('TIMER_START', myHandler);
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
      
      // Clean up empty listener sets
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   * @param {string} eventType - The event type to listen for
   * @param {Function} callback - Function to call when event is dispatched
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * eventBus.once('AUDIO_LOADED', () => {
   *   console.log('Audio loaded - this will only log once');
   * });
   */
  once(eventType, callback) {
    const onceCallback = (payload) => {
      callback(payload);
      this.off(eventType, onceCallback);
    };
    
    return this.on(eventType, onceCallback);
  }

  /**
   * Dispatch an event to all subscribers
   * @param {string} eventType - The event type to dispatch
   * @param {*} payload - Data to send to subscribers
   * 
   * @example
   * eventBus.dispatch('TIMER_START', { mode: 'periodic', interval: 5 });
   */
  dispatch(eventType, payload) {
    if (typeof eventType !== 'string') {
      throw new TypeError('Event type must be a string');
    }

    // Apply middleware
    let processedPayload = payload;
    for (const middleware of this.middleware) {
      try {
        processedPayload = middleware(eventType, processedPayload);
      } catch (error) {
        console.error(`[EventBus] Middleware error for ${eventType}:`, error);
      }
    }
    
    // Log in development mode
    if (this.devMode) {
      console.log(`[EventBus] ${eventType}`, processedPayload);
    }
    
    // Notify all listeners
    if (this.listeners.has(eventType)) {
      const listeners = this.listeners.get(eventType);
      
      listeners.forEach(callback => {
        try {
          callback(processedPayload);
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Add middleware function to process events
   * Middleware receives (eventType, payload) and must return processed payload
   * @param {Function} middleware - Middleware function
   * @throws {TypeError} If middleware is not a function
   * 
   * @example
   * eventBus.use((eventType, payload) => {
   *   // Add timestamp to all events
   *   return { ...payload, timestamp: Date.now() };
   * });
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middleware.push(middleware);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - The event type to clear
   * 
   * @example
   * eventBus.clear('TIMER_TICK');
   */
  clear(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event type
   * @param {string} eventType - The event type
   * @returns {number} Number of listeners
   * 
   * @example
   * const count = eventBus.listenerCount('TIMER_START');
   */
  listenerCount(eventType) {
    if (!this.listeners.has(eventType)) {
      return 0;
    }
    return this.listeners.get(eventType).size;
  }

  /**
   * Get all event types that have listeners
   * @returns {string[]} Array of event type names
   * 
   * @example
   * const events = eventBus.eventTypes();
   * console.log('Subscribed events:', events);
   */
  eventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Enable or disable development mode logging
   * @param {boolean} enabled - Enable development mode
   */
  setDevMode(enabled) {
    this.devMode = enabled;
  }
}

// Export singleton instance
export const eventBus = new EventBus();
