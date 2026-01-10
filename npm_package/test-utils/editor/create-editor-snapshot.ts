import type { EditorLanguage, EditorPreset } from '../../src/elements/editor/typings';

import { createEditorPreset } from './create-editor-preset';
import { DEFAULT_TEST_EDITOR_ID } from './wait-for-test-editor';

/**
 * Creates a default snapshot for testing purposes.
 */
export function createEditorSnapshot(): EditorSnapshot {
  return {
    editorId: DEFAULT_TEST_EDITOR_ID,
    content: {
      main: '<p>Initial content</p>',
    },
    preset: createEditorPreset(),
    contextId: null,
    editableHeight: null,
    language: {
      ui: 'en',
      content: 'en',
    },
    saveDebounceMs: 500,
    watchdog: false,
  };
}

/**
 * A snapshot of the Livewire component's state relevant to the CKEditor5 hook.
 */
export type EditorSnapshot = {
  /**
   * The unique identifier for the CKEditor5 instance.
   */
  editorId: string;

  /**
   * Whether to use a watchdog for the CKEditor5 instance.
   */
  watchdog: boolean;

  /**
   * The identifier of the CKEditor context.
   */
  contextId: string | null;

  /**
   * The debounce time in milliseconds for saving content changes.
   */
  saveDebounceMs: number;

  /**
   * The preset configuration for the CKEditor5 instance.
   */
  preset: EditorPreset;

  /**
   * The content of the editor, mapped by ID of root elements.
   */
  content: Record<string, string>;

  /**
   * The height of the editable area, if specified.
   */
  editableHeight: number | null;

  /**
   * The language of the editor UI and content.
   */
  language: EditorLanguage;
};
