import { DEFAULT_TEST_EDITOR_ID } from '../editor';

/**
 * Creates a snapshot of the Livewire component's state relevant to the CKEditor5 editable hook.
 *
 * @param rootName - The name of the root element in the editor. Defaults to 'main'.
 * @param content - The initial content value for the editable. Defaults to null.
 * @returns A snapshot object for the editable component.
 */
export function createEditableSnapshot(
  rootName: string = 'main',
  content: string | null = null,
): EditableSnapshot {
  return {
    rootName,
    editorId: DEFAULT_TEST_EDITOR_ID,
    content,
    saveDebounceMs: 0,
  };
}

/**
 * A snapshot of the Livewire component's state relevant to the CKEditor5 editable hook.
 */
export type EditableSnapshot = {
  /**
   * The ID of the editor instance this editable belongs to.
   */
  editorId: string;

  /**
   * The name of the root element in the editor.
   */
  rootName: string;

  /**
   * The initial content value for the editable.
   */
  content: string | null;

  /**
   * The debounce time in milliseconds for saving changes.
   */
  saveDebounceMs: number;
};
