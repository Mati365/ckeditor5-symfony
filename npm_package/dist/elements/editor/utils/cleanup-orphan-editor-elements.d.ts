import { Editor } from 'ckeditor5';
/**
 * Removes all DOM elements injected by a specific CKEditor instance.
 * Call this before assigning a new instance (e.g. in the 'restart' watchdog handler),
 * because the watchdog does not clean up the previous editor's DOM on its own.
 */
export declare function cleanupOrphanEditorElements(editor: Editor): void;
//# sourceMappingURL=cleanup-orphan-editor-elements.d.ts.map