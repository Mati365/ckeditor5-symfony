import { EditorId } from '../typings';
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
export declare function queryAllEditorEditables(editorId: EditorId): Record<string, EditableItem>;
/**
 * Type representing an editable item within an editor.
 * `element` is null when the root's DOM element hasn't appeared yet (pending root).
 */
export type EditableItem = {
    element: HTMLElement | null;
    content: string | null;
};
//# sourceMappingURL=query-all-editor-editables.d.ts.map