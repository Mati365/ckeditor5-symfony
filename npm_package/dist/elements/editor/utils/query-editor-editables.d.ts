import { EditorId } from '../typings';
/**
 * Gets the initial root elements for the editor based on its type.
 *
 * @param editorId The editor's ID.
 * @returns The root element(s) for the editor.
 */
export declare function queryEditablesElements(editorId: EditorId): Record<string, HTMLElement>;
/**
 * Gets the initial data for the roots of the editor. If the editor is a single editing-like editor,
 * it retrieves the initial value from the element's attribute. Otherwise, it returns an object mapping
 * editable names to their initial values.
 *
 * @param editorId The editor's ID.
 * @returns The initial values for the editor's roots.
 */
export declare function queryEditablesSnapshotContent(editorId: EditorId): Record<string, string>;
/**
 * Type representing an editable item within an editor.
 */
export type EditableItem = {
    element: HTMLElement;
    content: string | null;
};
//# sourceMappingURL=query-editor-editables.d.ts.map