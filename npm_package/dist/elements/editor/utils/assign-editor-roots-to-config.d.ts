import { EditorConfig } from 'ckeditor5';
import { EditorRelaxedConstructor } from '../types/editor-relaxed-constructor.type';
import { EditableItem } from './query-all-editor-editables';
/**
 * Assigns DOM elements and initial data to the editor configuration in a way that is compatible
 * with the specific editor type.
 *
 * Roots with `element: null` (pending roots not yet in the DOM) contribute only `initialData`
 * and are skipped for element assignment.
 *
 * @param Editor Constructor of the editor used to determine the location of element config entry.
 * @param editables Map of editable items (element + content) keyed by root name.
 * @param config Config of the editor.
 * @returns The updated configuration object.
 */
export declare function assignEditorRootsToConfig<C extends EditorConfig>(Editor: EditorRelaxedConstructor, editables: Record<string, EditableItem>, config: C): C;
//# sourceMappingURL=assign-editor-roots-to-config.d.ts.map