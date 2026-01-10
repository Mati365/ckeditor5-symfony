import type { EditableSnapshot } from './create-editable-snapshot';

import { html } from '../html';
import { createEditableSnapshot } from './create-editable-snapshot';

/**
 * Renders the editable component in the DOM.
 */
export function renderTestEditable(
  snapshot: Partial<EditableSnapshot> = {},
  options: { withInput?: boolean; } = {},
): HTMLElement {
  const fullSnapshot: EditableSnapshot = {
    ...createEditableSnapshot(),
    ...snapshot,
  };

  const element = html.tag(
    'cke5-editable',
    {
      ...fullSnapshot.editorId && {
        'data-cke-editor-id': fullSnapshot.editorId,
      },
      'data-cke-root-name': fullSnapshot.rootName,
      'data-cke-content': fullSnapshot.content,
      'data-cke-save-debounce-ms': fullSnapshot.saveDebounceMs,
    },
    ...[
      html.div({ 'data-cke-editable-content': '' }),
      ...options.withInput
        ? [html.input({ type: 'text' })]
        : [],
    ],
  );

  const wrapper = html.div({}, element);

  // The structure expected for decoupled editor might just be the element itself.
  // But append to body.
  document.body.appendChild(wrapper);

  return element;
}
