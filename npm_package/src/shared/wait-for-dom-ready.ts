/**
 * Returns a promise that resolves when the DOM is fully loaded and ready.
 */
export function waitForDOMReady(): Promise<void> {
  return new Promise((resolve) => {
    switch (document.readyState) {
      case 'loading':
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        break;

      case 'interactive':
      case 'complete':
        setTimeout(resolve, 0);
        break;

      default:
        console.warn('Unexpected document.readyState:', document.readyState);
        setTimeout(resolve, 0);
    }
  });
}
