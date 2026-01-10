import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { timeout } from './timeout.js';
import { waitForDOMReady } from './wait-for-dom-ready.js';

describe('waitForDOMReady', () => {
  let originalReadyState: DocumentReadyState;

  beforeEach(() => {
    originalReadyState = document.readyState;
  });

  afterEach(() => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return originalReadyState; },
    });

    vi.restoreAllMocks();
  });

  it('should resolve immediately if readyState is "interactive"', async () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return 'interactive'; },
    });

    const spy = vi.fn();
    void waitForDOMReady().then(spy);

    await timeout(0);
    expect(spy).toHaveBeenCalled();
  });

  it('should resolve immediately if readyState is "complete"', async () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return 'complete'; },
    });

    const spy = vi.fn();
    void waitForDOMReady().then(spy);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(spy).toHaveBeenCalled();
  });

  it('should wait for DOMContentLoaded event if readyState is "loading"', async () => {
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return 'loading'; },
    });

    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const spy = vi.fn();

    void waitForDOMReady().then(spy);

    expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function), { once: true });
    expect(spy).not.toHaveBeenCalled();

    // Simulate the event
    const handler = addEventListenerSpy.mock.calls[0]?.[1] as EventListener;
    handler({} as Event);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(spy).toHaveBeenCalled();
  });

  it('should warn and resolve immediately for unexpected readyState', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get() { return 'unexpected'; },
    });

    const spy = vi.fn();
    void waitForDOMReady().then(spy);

    await timeout(0);
    expect(consoleWarnSpy).toHaveBeenCalledWith('Unexpected document.readyState:', 'unexpected');
    expect(spy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});
