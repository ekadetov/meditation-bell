/**
 * State Manager for centralized application state
 * Implements observable state pattern with immutable updates
 * @module core/StateManager
 */

import { eventBus } from './EventBus.js';
import { EVENTS } from '../config/constants.js';
import { DEFAULT_STATE } from '../config/defaults.js';

/**
 * StateManager class manages application state and notifies subscribers of changes
 */
export class StateManager {
  /**
   * Creates a StateManager instance
   * @param {Object} initialState - Initial state object
   */
  constructor(initialState = DEFAULT_STATE) {
    /** @private {Object} Current application state */
    this.state = this.#deepClone(initialState);
    
    /** @private {EventBus} Reference to event bus */
    this.eventBus = eventBus;
    
    /** @private {Array<Function>} State validators */
    this.validators = [];
    
    /** @private {Array<Object>} State history for debugging */
    this.history = [];
    
    /** @private {number} Maximum history entries */
    this.maxHistory = 50;
  }

  /**
   * Get the current state
   * Returns a deep clone to prevent direct mutation
   * @returns {Object} Current state
   * 
   * @example
   * const currentState = stateManager.getState();
   * console.log(currentState.timer.isActive);
   */
  getState() {
    return this.#deepClone(this.state);
  }

  /**
   * Get a specific part of the state
   * @param {string} path - Dot-notation path to state property
   * @returns {*} State value at path
   * 
   * @example
   * const timerMode = stateManager.get('timer.currentMode');
   * const isActive = stateManager.get('timer.isActive');
   */
  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return this.#deepClone(value);
  }

  /**
   * Update the state
   * Performs validation and emits STATE_CHANGED event
   * @param {Object|Function} updates - New state or updater function
   * @throws {Error} If state validation fails
   * 
   * @example
   * // Object update
   * stateManager.setState({
   *   timer: { ...currentState.timer, isActive: true }
   * });
   * 
   * // Function update
   * stateManager.setState((currentState) => ({
   *   ...currentState,
   *   timer: { ...currentState.timer, elapsedSeconds: currentState.timer.elapsedSeconds + 1 }
   * }));
   */
  setState(updates) {
    const previousState = this.#deepClone(this.state);
    
    // Apply updates
    const newState = typeof updates === 'function'
      ? updates(previousState)
      : { ...previousState, ...updates };
    
    // Validate new state
    const validationResult = this.#validate(newState);
    if (!validationResult.valid) {
      throw new Error(`State validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Update state
    this.state = newState;
    
    // Add to history
    this.#addToHistory(previousState, newState);
    
    // Emit state changed event
    this.eventBus.dispatch(EVENTS.STATE_CHANGED, {
      state: this.#deepClone(newState),
      previousState: this.#deepClone(previousState)
    });
  }

  /**
   * Update a specific part of the state
   * @param {string} path - Dot-notation path to state property
   * @param {*} value - New value
   * 
   * @example
   * stateManager.set('timer.isActive', true);
   * stateManager.set('audio.volume', 0.5);
   */
  set(path, value) {
    const keys = path.split('.');
    const newState = this.#deepClone(this.state);
    
    let current = newState;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    this.setState(newState);
  }

  /**
   * Reset state to initial values
   * @param {Object} initialState - State to reset to (defaults to DEFAULT_STATE)
   * 
   * @example
   * stateManager.reset();
   */
  reset(initialState = DEFAULT_STATE) {
    this.setState(this.#deepClone(initialState));
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call on state changes
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * const unsubscribe = stateManager.subscribe((state, previousState) => {
   *   console.log('State changed:', state);
   * });
   */
  subscribe(callback) {
    return this.eventBus.on(EVENTS.STATE_CHANGED, ({ state, previousState }) => {
      callback(state, previousState);
    });
  }

  /**
   * Subscribe to changes in a specific part of the state
   * @param {string} path - Dot-notation path to watch
   * @param {Function} callback - Function to call when value changes
   * @returns {Function} Unsubscribe function
   * 
   * @example
   * const unsubscribe = stateManager.watch('timer.isActive', (newValue, oldValue) => {
   *   console.log('Timer active changed:', newValue);
   * });
   */
  watch(path, callback) {
    let previousValue = this.get(path);
    
    return this.subscribe((state, previousState) => {
      const newValue = this.get(path);
      
      if (!this.#deepEqual(newValue, previousValue)) {
        callback(newValue, previousValue);
        previousValue = newValue;
      }
    });
  }

  /**
   * Add a state validator
   * @param {Function} validator - Validator function that returns {valid, errors}
   * 
   * @example
   * stateManager.addValidator((state) => {
   *   if (state.audio.volume < 0 || state.audio.volume > 1) {
   *     return { valid: false, errors: ['Volume must be between 0 and 1'] };
   *   }
   *   return { valid: true, errors: [] };
   * });
   */
  addValidator(validator) {
    if (typeof validator !== 'function') {
      throw new TypeError('Validator must be a function');
    }
    this.validators.push(validator);
  }

  /**
   * Get state history
   * @param {number} count - Number of history entries to return
   * @returns {Array<Object>} History entries
   * 
   * @example
   * const history = stateManager.getHistory(10);
   */
  getHistory(count = this.maxHistory) {
    return this.history.slice(-count);
  }

  /**
   * Clear state history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Deep clone an object
   * @private
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  #deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.#deepClone(item));
    }
    
    if (obj instanceof Set) {
      return new Set(Array.from(obj).map(item => this.#deepClone(item)));
    }
    
    if (obj instanceof Map) {
      return new Map(Array.from(obj).map(([key, value]) => [key, this.#deepClone(value)]));
    }
    
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = this.#deepClone(obj[key]);
      }
    }
    
    return clonedObj;
  }

  /**
   * Deep equality check
   * @private
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} True if deeply equal
   */
  #deepEqual(a, b) {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.#deepEqual(item, b[index]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => this.#deepEqual(a[key], b[key]));
  }

  /**
   * Validate state using all validators
   * @private
   * @param {Object} state - State to validate
   * @returns {Object} Validation result {valid, errors}
   */
  #validate(state) {
    const errors = [];
    
    for (const validator of this.validators) {
      try {
        const result = validator(state);
        if (result && !result.valid) {
          errors.push(...(result.errors || []));
        }
      } catch (error) {
        errors.push(`Validator error: ${error.message}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Add state change to history
   * @private
   * @param {Object} previousState - Previous state
   * @param {Object} newState - New state
   */
  #addToHistory(previousState, newState) {
    this.history.push({
      timestamp: Date.now(),
      previousState: this.#deepClone(previousState),
      newState: this.#deepClone(newState)
    });
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
}

// Export singleton instance
export const stateManager = new StateManager();
