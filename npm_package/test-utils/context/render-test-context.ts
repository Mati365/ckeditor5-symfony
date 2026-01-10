import type { Snapshot } from './create-context-snapshot';

import { html } from '../html';
import { createContextSnapshot } from './create-context-snapshot';

/**
 * Renders the context component in the DOM.
 */
export function renderTestContext(
  snapshot: Partial<Snapshot> = {},
  options: { container?: HTMLElement; } = {},
): HTMLElement {
  const fullSnapshot: Snapshot = {
    ...createContextSnapshot(),
    ...snapshot,
  };

  const component = html.tag('cke5-context', {
    'data-cke-context-id': fullSnapshot.contextId,
    'data-cke-context': JSON.stringify(fullSnapshot.context),
    'data-cke-language': JSON.stringify(fullSnapshot.language),
  });

  const container = options.container || document.body;
  container.appendChild(component);

  return component;
}
