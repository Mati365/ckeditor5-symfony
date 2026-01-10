import { DEFAULT_TEST_EDITOR_ID } from '../editor';

/**
 * Creates a snapshot of the Livewire component's state relevant to the CKEditor5 UI part hook.
 *
 * @param name - The name of the UI part (e.g., "toolbar", "menubar"). Defaults to 'toolbar'.
 * @returns A snapshot object for the UI part component.
 */
export function createUIPartSnapshot(name: string = 'toolbar'): UISnapshot {
  return {
    name,
    editorId: DEFAULT_TEST_EDITOR_ID,
  };
}

/**
 * A snapshot of the Livewire component's state relevant to the CKEditor5 UI part hook.
 */
export type UISnapshot = {
  /**
   * The ID of the editor instance this UI part belongs to.
   */
  editorId: string;

  /**
   * The name of the UI part (e.g., "toolbar", "menubar").
   */
  name: string;
};
