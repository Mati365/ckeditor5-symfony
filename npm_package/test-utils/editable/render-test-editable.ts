import { DEFAULT_TEST_EDITOR_ID } from '../editor';
import { html } from '../html';

/**
 * Renders the editable component in the DOM.
 */
export function renderTestEditable(
  {
    editorId = DEFAULT_TEST_EDITOR_ID,
    rootName = 'main',
    modelElement,
    content,
    saveDebounceMs,
    withInput,
  }: Options,
): HTMLElement {
  const element = html.tag(
    'cke5-editable',
    {
      ...editorId && {
        'data-cke-editor-id': editorId,
      },
      'data-cke-root-name': rootName,
      'data-cke-content': content,
      'data-cke-save-debounce-ms': saveDebounceMs,
      ...modelElement && {
        'data-cke-root-model-element-name': modelElement,
      },
    },
    ...[
      html.div({ 'data-cke-editable-content': '' }),
      ...withInput
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

type Options = {
  /**
   * Render HTML input.
   */
  withInput?: boolean;

  /**
   * The ID of the editor instance this editable belongs to.
   */
  editorId?: string;

  /**
   * The name of the root element in the editor.
   */
  rootName: string;

  /**
   * Model element name.
   */
  modelElement?: string;

  /**
   * The initial content value for the editable.
   */
  content?: string | null;

  /**
   * The debounce time in milliseconds for saving changes.
   */
  saveDebounceMs?: number;
};
