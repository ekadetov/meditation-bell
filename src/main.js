/**
 * Main application bootstrap
 * Initializes core systems and Web Components
 * @module main
 */

import { eventBus } from './core/EventBus.js';
import { stateManager } from './core/StateManager.js';
import { TimerEngine } from './core/TimerEngine.js';
import { PeriodicMode } from './core/modes/PeriodicMode.js';
import { RandomMode } from './core/modes/RandomMode.js';
import { ReminderMode } from './core/modes/ReminderMode.js';
import { HourlyMode } from './core/modes/HourlyMode.js';
import { audioSystem } from './audio/AudioSystem.js';
import { EVENTS, STORAGE_KEYS, APP_VERSION } from './config/constants.js';
import { DEFAULT_PREFERENCES, DEFAULT_STATE } from './config/defaults.js';

// Import storage and AI modules
import { storageManager, sessionStore, insightsStore, preferencesStore } from './storage/index.js';
import { moodTracker, ambientDetector, patternDetector, insightGenerator } from './ai/index.js';
import { sessionManager } from './core/SessionManager.js';

// Import global styles
import './styles/design-tokens.css';
import './styles/global.css';
import './styles/animations.css';

// Import all Web Components (registers them automatically)
import './components/AppShell.js';
import './components/Header.js';
import './components/Footer.js';
import './components/WelcomeMessage.js';
import './components/TimerDisplay.js';
import './components/ControlButtons.js';
import './components/AudioControls.js';
import './components/ModeSelector.js';
import './components/PeriodicModePanel.js';
import './components/RandomModePanel.js';
import './components/HourlyModePanel.js';
import './components/MoodCheckModal.js';
import './components/InsightsDashboard.js';
import './components/StatsDisplay.js';
import './components/SessionHistory.js';
import './components/PrivacySettings.js';

/**
 * Application class - main entry point
 */
class AwakeningBellApp {
  constructor() {
    /** @private {TimerEngine} Timer instance */
    this.timer = null;
    
    /** @private {Object} Current mode instance */
    this.currentMode = null;
    
    /** @private {boolean} Initialization status */
    this.initialized = false;
    
    /** @private {string} Current mode name */
    this.currentModeName = 'periodic';
    
    /** @private {string} Current session ID */
    this.currentSessionId = null;
    
    /** @private {number} Session counter for insight generation */
    this.sessionCount = 0;
    
    console.log(`[AwakeningBell] v${APP_VERSION} initializing...`);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize storage system
      await this.#initializeStorage();
      
      // Load user preferences
      await this.#loadPreferences();
      
      // Initialize AI modules
      await this.#initializeAI();
      
      // Initialize event listeners
      this.#initializeEventListeners();
      
      // Initialize audio system
      await this.#initializeAudio();
      
      // Create timer with default mode
      this.#initializeTimer();
      
      // Render UI
      this.#renderUI();
      
      // Attach component event listeners
      this.#attachComponentListeners();
      
      this.initialized = true;
      console.log('[AwakeningBell] Initialization complete');
      
      // Expose globals for component access
      window.eventBus = eventBus;
      window.stateManager = stateManager;
      window.audioSystem = audioSystem;
      window.timerEngine = this.timer;
      window.sessionStore = sessionStore;
      window.insightsStore = insightsStore;
      
      // Dispatch ready event
      eventBus.dispatch(EVENTS.STATE_CHANGED, stateManager.getState());
      
    } catch (error) {
      console.error('[AwakeningBell] Initialization failed:', error);
      this.#showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize storage system
   * @private
   */
  async #initializeStorage() {
    try {
      await storageManager.initialize();
      await preferencesStore.initialize();
      await sessionStore.initialize();
      await insightsStore.initialize();
      console.log('[App] Storage system initialized');
    } catch (error) {
      console.error('[App] Failed to initialize storage:', error);
    }
  }

  /**
   * Initialize AI modules
   * @private
   */
  async #initializeAI() {
    try {
      // Load existing sessions for pattern analysis
      const sessions = await sessionStore.getAllSessions();
      if (sessions.length > 0) {
        patternDetector.loadSessions(sessions);
      }
      console.log('[App] AI modules initialized');
    } catch (error) {
      console.error('[App] Failed to initialize AI:', error);
    }
  }

  /**
   * Initialize audio system
   * @private
   */
  async #initializeAudio() {
    try {
      const prefs = stateManager.getState().user?.preferences;
      const preload = prefs?.audio?.preloadAudio !== false;
      
      await audioSystem.initialize({ preload });
      console.log('[App] Audio system initialized');
      
      // Listen for audio events
      eventBus.on(EVENTS.AUDIO_ERROR, (data) => {
        console.error('[App] Audio error:', data);
      });
      
      eventBus.on(EVENTS.AUDIO_LOADED, (data) => {
        console.log('[App] Audio loaded:', data);
      });
      
    } catch (error) {
      console.error('[App] Failed to initialize audio system:', error);
      // Don't fail the whole app if audio fails
    }
  }

  /**
   * Load user preferences from localStorage
   * @private
   */
  #loadPreferences() {
    try {
      const storedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        console.log('[AwakeningBell] Loaded preferences from localStorage');
        
        // Update state with loaded preferences
        stateManager.setState((state) => ({
          ...state,
          user: {
            ...state.user,
            preferences: {
              ...DEFAULT_PREFERENCES,
              ...prefs
            }
          }
        }));
      } else {
        console.log('[AwakeningBell] Using default preferences');
        // Save default preferences
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(DEFAULT_PREFERENCES));
      }
      
      // Store version
      localStorage.setItem(STORAGE_KEYS.VERSION, APP_VERSION);
      
    } catch (error) {
      console.error('[AwakeningBell] Failed to load preferences:', error);
      // Use defaults
      stateManager.setState((state) => ({
        ...state,
        user: {
          ...state.user,
          preferences: DEFAULT_PREFERENCES
        }
      }));
    }
  }

  /**
   * Initialize event listeners
   * @private
   */
  #initializeEventListeners() {
    // Listen to timer events for state updates
    eventBus.on(EVENTS.TIMER_START, async (data) => {
      console.log('[App] Timer started:', data);
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          status: 'running',
          startedAt: Date.now()
        }
      }));
      
      // Start session tracking
      await sessionManager.startSession(this.currentModeName, this.currentMode?.config || {});
    });
    
    eventBus.on(EVENTS.TIMER_PAUSE, (data) => {
      console.log('[App] Timer paused:', data);
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          status: 'paused'
        }
      }));
    });
    
    eventBus.on(EVENTS.TIMER_RESUME, (data) => {
      console.log('[App] Timer resumed:', data);
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          status: 'running'
        }
      }));
    });
    
    eventBus.on(EVENTS.TIMER_STOP, async (data) => {
      console.log('[App] Timer stopped:', data);
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          status: 'stopped',
          elapsed: 0
        }
      }));
      
      // End session tracking
      await sessionManager.endSession();
    });
    
    eventBus.on(EVENTS.TIMER_TICK, (data) => {
      // Update elapsed time
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          elapsed: Math.floor(data.elapsedTime / 1000)
        }
      }));
    });
    
    eventBus.on(EVENTS.BELL_RING, async (data) => {
      console.log('[App] Bell rang:', data);
      try {
        await audioSystem.playBell(data.bellType || 'small');
        // Track bell ring for session
        sessionManager.recordBellRing();
      } catch (error) {
        console.error('[App] Failed to play bell:', error);
      }
    });
    
    eventBus.on(EVENTS.STATE_CHANGED, (state) => {
      // Save preferences when they change
      if (state.user?.preferences) {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(state.user.preferences));
      }
    });
  }

  /**
   * Initialize timer with default mode
   * @private
   */
  #initializeTimer() {
    const state = stateManager.getState();
    const mode = state.timer.currentMode || 'periodic';
    const config = state.timer.config || { smallInterval: 5, bigInterval: 15 };
    
    // Create mode instance
    this.currentMode = this.#createModeInstance(mode, config);
    this.currentModeName = mode;
    
    // Create timer
    this.timer = new TimerEngine({
      mode: this.currentMode,
      eventBus
    });
    
    console.log(`[App] Timer initialized with ${mode} mode`);
  }

  /**
   * Create a mode instance based on mode name
   * @private
   * @param {string} modeName - Mode name
   * @param {Object} config - Mode configuration
   * @returns {Object} Mode instance
   */
  #createModeInstance(modeName, config) {
    switch (modeName) {
      case 'periodic':
        return new PeriodicMode(config);
      case 'random':
        return new RandomMode(config);
      case 'reminder':
        return new ReminderMode(config);
      case 'hourly':
        return new HourlyMode(config);
      default:
        console.warn(`[App] Unknown mode: ${modeName}, using periodic`);
        return new PeriodicMode(config);
    }
  }

  /**
   * Render UI with Web Components
   * @private
   */
  #renderUI() {
    const appDiv = document.getElementById('app');
    
    appDiv.innerHTML = `
      <app-shell>
        <app-header slot="header" version="${APP_VERSION}"></app-header>
        
        <!-- Meditate Tab -->
        <div slot="meditate">
          <welcome-message></welcome-message>
          
          <mode-selector></mode-selector>
          
          <div class="mode-panels">
            <periodic-mode-panel id="periodic-panel" style="display: block;"></periodic-mode-panel>
            <random-mode-panel id="random-panel" style="display: none;"></random-mode-panel>
            <hourly-mode-panel id="hourly-panel" style="display: none;"></hourly-mode-panel>
          </div>
          
          <timer-display status="idle" elapsed="0"></timer-display>
          
          <control-buttons status="idle"></control-buttons>
          
          <audio-controls volume="70" muted="false"></audio-controls>
        </div>
        
        <!-- Stats & Insights Tab -->
        <div slot="stats">
          <stats-display></stats-display>
          <insights-dashboard></insights-dashboard>
        </div>
        
        <!-- History Tab -->
        <div slot="history">
          <session-history></session-history>
        </div>
        
        <!-- Privacy Tab -->
        <div slot="privacy">
          <privacy-settings></privacy-settings>
        </div>
        
        <app-footer slot="footer" version="${APP_VERSION}"></app-footer>
      </app-shell>
    `;
  }

  /**
   * Attach event listeners to Web Components
   * @private
   */
  #attachComponentListeners() {
    const appDiv = document.getElementById('app');
    
    // Mode selector events
    appDiv.addEventListener('mode-change', (e) => {
      const { mode } = e.detail;
      console.log('[App] Mode changed to:', mode);
      
      this.currentModeName = mode;
      
      // Hide all panels
      const panels = appDiv.querySelectorAll('.mode-panels > *');
      panels.forEach(panel => {
        if (panel instanceof HTMLElement) {
          panel.style.display = 'none';
        }
      });
      
      // Show selected panel
      const activePanel = appDiv.querySelector(`#${mode}-panel`);
      if (activePanel instanceof HTMLElement) {
        activePanel.style.display = 'block';
      }
    });
    
    // Mode configuration events
    appDiv.addEventListener('mode-config', async (e) => {
      const { mode, config } = e.detail;
      console.log('[App] Mode configured:', mode, config);
      
      // Enable audio on first interaction
      try {
        await audioSystem.enableAudio();
      } catch (error) {
        console.error('[App] Failed to enable audio:', error);
      }
      
      // Create new mode instance
      this.currentMode = this.#createModeInstance(mode, config);
      this.currentModeName = mode;
      
      // Update state
      stateManager.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          currentMode: mode,
          config,
          mode
        }
      }));
      
      // Start timer
      if (this.timer) {
        this.timer.stop();
      }
      
      this.timer = new TimerEngine({
        mode: this.currentMode,
        eventBus
      });
      
      if (this.currentMode && typeof this.currentMode.onStart === 'function') {
        this.currentMode.onStart(this.timer);
      } else {
        this.timer.start();
      }
    });
    
    // Control button events
    appDiv.addEventListener('control-action', async (e) => {
      const { action } = e.detail;
      console.log('[App] Control action:', action);
      
      // Enable audio on first interaction
      try {
        await audioSystem.enableAudio();
      } catch (error) {
        console.error('[App] Failed to enable audio:', error);
      }
      
      switch (action) {
        case 'start':
          if (this.timer) {
            if (this.currentMode && typeof this.currentMode.onStart === 'function') {
              this.currentMode.onStart(this.timer);
            } else {
              this.timer.start();
            }
          }
          break;
        case 'pause':
          if (this.timer) {
            this.timer.pause();
          }
          break;
        case 'resume':
          if (this.timer) {
            this.timer.resume();
          }
          break;
        case 'stop':
          if (this.timer) {
            this.timer.stop();
          }
          break;
      }
    });
    
    // Audio control events
    appDiv.addEventListener('audio-action', async (e) => {
      const { action, bellType } = e.detail;
      console.log('[App] Audio action:', action, bellType);
      
      // Enable audio on first interaction
      try {
        await audioSystem.enableAudio();
      } catch (error) {
        console.error('[App] Failed to enable audio:', error);
      }
      
      switch (action) {
        case 'toggle-mute':
          audioSystem.toggleMute(0.1);
          const status = audioSystem.getStatus();
          const audioControl = appDiv.querySelector('audio-controls');
          if (audioControl) {
            audioControl.setAttribute('muted', String(status.volume.isMuted));
          }
          break;
        case 'preview-bell':
          try {
            await audioSystem.playBell(bellType || 'small');
          } catch (error) {
            console.error('[App] Failed to play bell:', error);
          }
          break;
      }
    });
    
    appDiv.addEventListener('volume-change', (e) => {
      const { volume } = e.detail;
      audioSystem.setVolume(volume / 100);
    });
  }

  /**
   * Show error message
   * @private
   * @param {string} message - Error message
   */
  #showError(message) {
    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        text-align: center;
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
      ">
        <h1 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 1rem;">Error</h1>
        <p style="margin-bottom: 2rem;">${message}</p>
        <button onclick="location.reload()" style="
          padding: 1rem 2rem;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
        ">Reload Page</button>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AwakeningBellApp();
  app.init();
  
  // Expose for debugging
  if (typeof window !== 'undefined') {
    window.awakeningBell = {
      app,
      eventBus,
      stateManager,
      audioSystem,
      version: APP_VERSION
    };
  }
});
