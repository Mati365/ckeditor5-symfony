import type { EditorId } from '../typings';

import { filterObjectValues, mapObjectValues } from '../../../shared';

/**
 * Gets the initial root elements for the editor based on its type.
 *
 * @param editorId The editor's ID.
 * @returns The root element(s) for the editor.
 */
export function queryEditablesElements(editorId: EditorId) {
  const editables = queryAllEditorEditables(editorId);

  return mapObjectValues(editables, ({ element }) => element);
}

/**
 * Gets the initial data for the roots of the editor. If the editor is a single editing-like editor,
 * it retrieves the initial value from the element's attribute. Otherwise, it returns an object mapping
 * editable names to their initial values.
 *
 * @param editorId The editor's ID.
 * @returns The initial values for the editor's roots.
 */
export function queryEditablesSnapshotContent(editorId: EditorId) {
  const editables = queryAllEditorEditables(editorId);
  const values = mapObjectValues(editables, ({ content }) => content);

  return filterObjectValues(values, value => typeof value === 'string') as Record<string, string>;
}

/**
 * Queries all editable elements within a specific editor instance. It picks
 * initial values from actually rendered elements or from the editor container's.
 *
 * It may differ from the `initialData` used during editor creation, as it might
 * not set all roots or set different values.
 *
 * @param editorId The ID of the editor to query.
 * @returns An object mapping editable names to their corresponding elements and initial values.
 */
function queryAllEditorEditables(editorId: EditorId) {
  const acc = (
    Array
      .from(document.querySelectorAll<HTMLElement>(`cke5-editable[data-cke-editor-id="${editorId}"]`))
      .reduce<Record<string, EditableItem>>((acc, element) => {
        const rootName = element.getAttribute('data-cke-root-name')!;
        const content = element.getAttribute('data-cke-content');

        acc[rootName] = {
          element: element.querySelector<HTMLElement>('[data-cke-editable-content]')!,
          content,
        };

        return acc;
      }, Object.create({}))
  );

  const editor = document.querySelector<HTMLElement>(`cke5-editor[data-cke-editor-id="${editorId}"]`);

  /* v8 ignore next 3 */
  if (!editor) {
    return acc;
  }

  const currentMain = acc['main'];
  const initialRootEditableValue = JSON.parse(editor.getAttribute('data-cke-content')!);
  const contentElement = document.querySelector<HTMLElement>(`#${editorId}_editor `);

  // If found `main` editable, but it has no content, try to fill it from the editor container.
  if (currentMain && initialRootEditableValue?.['main']) {
    return {
      ...acc,
      main: {
        ...currentMain,
        content: currentMain.content || initialRootEditableValue['main'],
      },
    };
  }

  // If no `main` editable found, try to create it from the editor container.
  if (contentElement) {
    return {
      ...acc,
      main: {
        element: contentElement,
        content: initialRootEditableValue?.['main'] || null,
      },
    };
  }

  return acc;
}

/**
 * Type representing an editable item within an editor.
 */
export type EditableItem = {
  element: HTMLElement;
  content: string | null;
};
