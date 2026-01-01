/**
 * Queries all CKEditor 5 editor IDs present in the document.
 */
export function queryAllEditorIds(): string[] {
  return Array
    .from(document.querySelectorAll<HTMLElement>('cke5-editor'))
    .map(element => element.getAttribute('data-cke-editor-id'))
    .filter((id): id is string => id !== null);
}
