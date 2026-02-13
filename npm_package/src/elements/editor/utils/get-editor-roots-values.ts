import type { Editor } from 'ckeditor5';

/**
 * Gets values of all editor roots.
 *
 * @param editor The editor instance.
 * @returns A record where keys are root names and values are root HTML strings.
 */
export function getEditorRootsValues(editor: Editor): Record<string, string> {
  return Array
    .from(editor.model.document.getRoots())
    .reduce<Record<string, string>>((acc, root) => {
      if (root.rootName === '$graveyard') {
        return acc;
      }

      acc[root.rootName] = editor.getData({ rootName: root.rootName });

      return acc;
    }, Object.create({}));
}
