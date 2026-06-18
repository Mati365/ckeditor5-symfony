import type { EditorId } from '../typings';

/**
 * Queries all editable elements within a specific editor instance. It picks
 * initial values from actually rendered elements or from the editor container's
 * `data-cke-content` attribute, whichever is available.
 *
 * Roots present in the editor container's content but without a matching
 * `cke5-editable` element yet are included with `element: null` — these are
 * "pending" roots that haven't been attached to the DOM yet.
 *
 * @param editorId The ID of the editor to query.
 * @returns An object mapping root names to their corresponding elements and content.
 */
export function queryAllEditorEditables(editorId: EditorId): Record<string, EditableItem> {
  const acc = Array
    .from(document.querySelectorAll<HTMLElement>(`cke5-editable[data-cke-editor-id="${editorId}"]`))
    .reduce<Record<string, EditableItem>>((acc, element) => {
      const rootName = element.getAttribute('data-cke-root-name')!;
      const modelElement = element.getAttribute('data-cke-root-model-element-name') || null;

      acc[rootName] = {
        element: element.querySelector<HTMLElement>('[data-cke-editable-content]'),
        content: element.getAttribute('data-cke-content'),
        modelElement,
      };

      return acc;
    }, Object.create(null));

  const rootEditorElement = document.querySelector<HTMLElement>(`cke5-editor[data-cke-editor-id="${editorId}"]`);

  /* v8 ignore next 3 -- @preserve */
  if (!rootEditorElement) {
    return acc;
  }

  /* v8 ignore next 1 -- @preserve */
  const editorContent: Record<string, string> = JSON.parse(rootEditorElement.getAttribute('data-cke-content')!) ?? {};
  const classicMainElement = document.querySelector<HTMLElement>(`#${editorId}_editor`);
  const rootEditorModelElement = rootEditorElement.getAttribute('data-cke-root-model-element-name');

  if ('main' in acc) {
    acc['main'].modelElement ??= rootEditorModelElement;
  }
  else if (classicMainElement && !acc['main']) {
    acc['main'] = {
      element: classicMainElement,
      content: editorContent['main'] || '',
      modelElement: rootEditorModelElement,
    };
  }

  for (const [rootName, rootContent] of Object.entries(editorContent)) {
    if (acc[rootName]) {
      // Editable element is already present — fill content from editor level if the editable didn't provide its own.
      acc[rootName] = {
        ...acc[rootName],
        content: acc[rootName].content ?? rootContent,
        modelElement: acc[rootName].modelElement ?? rootEditorModelElement,
      };
    }
    else {
      // Root has server-provided content but its editable element hasn't been attached to the DOM yet.
      acc[rootName] = {
        element: null,
        content: rootContent,
        modelElement: rootEditorModelElement,
      };
    }
  }

  return acc;
}

/**
 * Type representing an editable item within an editor.
 * `element` is null when the root's DOM element hasn't appeared yet (pending root).
 */
export type EditableItem = {
  element: HTMLElement | null;
  content: string | null;
  modelElement: string | null;
};
