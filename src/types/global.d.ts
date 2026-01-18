/**
 * Global Type Declarations
 *
 * Extends global interfaces for application-specific properties.
 */

export {};

declare global {
  interface Window {
    eventBus?: import('../core/EventBus').EventBus;
    stateManager?: import('../core/StateManager').StateManager;
    audioSystem?: import('../audio/AudioSystem').AudioSystem;
    timerEngine?: import('../core/TimerEngine').TimerEngine | null;
    awakeningBell?: {
      app: any;
      eventBus: any;
      stateManager: any;
      audioSystem: any;
      version: string;
    };
  }
}
