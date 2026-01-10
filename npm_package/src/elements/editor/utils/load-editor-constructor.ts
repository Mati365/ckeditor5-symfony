import type { EditorType } from '../typings';

import { CKEditor5SymfonyError } from '../../../ckeditor5-symfony-error';

/**
 * Returns the constructor for the specified CKEditor5 editor type.
 *
 * @param type - The type of the editor to load.
 * @returns A promise that resolves to the editor constructor.
 */
export async function loadEditorConstructor(type: EditorType) {
  const PKG = await import('ckeditor5');

  const editorMap = {
    inline: PKG.InlineEditor,
    balloon: PKG.BalloonEditor,
    classic: PKG.ClassicEditor,
    decoupled: PKG.DecoupledEditor,
    multiroot: PKG.MultiRootEditor,
  } as const;

  const EditorConstructor = editorMap[type];

  if (!EditorConstructor) {
    throw new CKEditor5SymfonyError(`Unsupported editor type: ${type}`);
  }

  return EditorConstructor;
}
