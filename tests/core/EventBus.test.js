/**
 * EventBus unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus.js';

describe('EventBus', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
      expect(eventBus.listeners).toBeInstanceOf(Map);
      expect(eventBus.middleware).toBeInstanceOf(Array);
    });
  });

  describe('on() method', () => {
    it('should subscribe to an event', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);
    });

    it('should return an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('TEST_EVENT', callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      unsubscribe();
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });

    it('should throw TypeError for invalid event type', () => {
      expect(() => eventBus.on(123, vi.fn())).toThrow(TypeError);
    });

    it('should throw TypeError for invalid callback', () => {
      expect(() => eventBus.on('TEST_EVENT', 'not a function')).toThrow(TypeError);
    });
  });

  describe('off() method', () => {
    it('should unsubscribe from an event', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      
      eventBus.off('TEST_EVENT', callback);
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });

    it('should clean up empty listener sets', () => {
      const callback = vi.fn();
      eventBus.on('TEST_EVENT', callback);
      eventBus.off('TEST_EVENT', callback);
      
      expect(eventBus.listeners.has('TEST_EVENT')).toBe(false);
    });
  });

  describe('once() method', () => {
    it('should subscribe only once', () => {
      const callback = vi.fn();
      eventBus.once('TEST_EVENT', callback);
      
      eventBus.dispatch('TEST_EVENT', { data: 1 });
      eventBus.dispatch('TEST_EVENT', { data: 2 });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 1 });
    });
  });

  describe('dispatch() method', () => {
    it('should call all subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      eventBus.on('TEST_EVENT', callback1);
      eventBus.on('TEST_EVENT', callback2);
      
      eventBus.dispatch('TEST_EVENT', { data: 'test' });
      
      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const successCallback = vi.fn();
      
      eventBus.on('TEST_EVENT', errorCallback);
      eventBus.on('TEST_EVENT', successCallback);
      
      // Should not throw
      expect(() => eventBus.dispatch('TEST_EVENT', {})).not.toThrow();
      
      expect(successCallback).toHaveBeenCalled();
    });

    it('should throw TypeError for invalid event type', () => {
      expect(() => eventBus.dispatch(123, {})).toThrow(TypeError);
    });
  });

  describe('use() method', () => {
    it('should add middleware', () => {
      const middleware = (eventType, payload) => ({ ...payload, processed: true });
      
      eventBus.use(middleware);
      expect(eventBus.middleware).toHaveLength(1);
    });

    it('should apply middleware to dispatched events', () => {
      const middleware = (eventType, payload) => ({ ...payload, enhanced: true });
      const callback = vi.fn();
      
      eventBus.use(middleware);
      eventBus.on('TEST_EVENT', callback);
      
      eventBus.dispatch('TEST_EVENT', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test', enhanced: true });
    });

    it('should throw TypeError for invalid middleware', () => {
      expect(() => eventBus.use('not a function')).toThrow(TypeError);
    });
  });

  describe('clear() method', () => {
    it('should clear all listeners for an event', () => {
      eventBus.on('TEST_EVENT', vi.fn());
      eventBus.on('TEST_EVENT', vi.fn());
      
      eventBus.clear('TEST_EVENT');
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
    });

    it('should clear all listeners when no event specified', () => {
      eventBus.on('EVENT1', vi.fn());
      eventBus.on('EVENT2', vi.fn());
      
      eventBus.clear();
      expect(eventBus.listeners.size).toBe(0);
    });
  });

  describe('listenerCount() method', () => {
    it('should return the correct listener count', () => {
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(0);
      
      eventBus.on('TEST_EVENT', vi.fn());
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(1);
      
      eventBus.on('TEST_EVENT', vi.fn());
      expect(eventBus.listenerCount('TEST_EVENT')).toBe(2);
    });
  });

  describe('eventTypes() method', () => {
    it('should return all event types', () => {
      eventBus.on('EVENT1', vi.fn());
      eventBus.on('EVENT2', vi.fn());
      
      const types = eventBus.eventTypes();
      expect(types).toContain('EVENT1');
      expect(types).toContain('EVENT2');
      expect(types).toHaveLength(2);
    });
  });

  describe('setDevMode() method', () => {
    it('should enable/disable dev mode', () => {
      eventBus.setDevMode(true);
      expect(eventBus.devMode).toBe(true);
      
      eventBus.setDevMode(false);
      expect(eventBus.devMode).toBe(false);
    });
  });
});
