import { DEFAULT_TEST_EDITOR_ID } from '../editor';
import { html } from '../html';

/**
 * Renders the UI part component in the DOM.
 */
export function renderTestUIPart(
  {
    name = 'toolbar',
    editorId = DEFAULT_TEST_EDITOR_ID,
  }: Options = {},
): HTMLElement {
  const el = html.tag('cke5-ui-part', {
    'data-cke-name': name,
    'data-cke-editor-id': editorId,
  });

  document.body.appendChild(el);
  return el;
}

type Options = {
  /**
   * The ID of the editor instance this UI part belongs to.
   */
  editorId?: string | null;

  /**
   * The name of the UI part (e.g., "toolbar", "menubar").
   */
  name?: string;
};
