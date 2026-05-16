import { EditorConfig } from 'ckeditor5';
import { EditorRelaxedConstructor } from '../types/editor-relaxed-constructor.type';
/**
 * Assigns a DOM element to the editor configuration in a way that is compatible with the specific editor type.
 *
 * @param Editor Constructor of the editor used to determine the location of element config entry.
 * @param elementOrMap Element to be assigned to config.
 * @param config Config of the editor.
 * @returns The updated configuration object.
 */
export declare function assignSourceElementsToEditorConfig<C extends EditorConfig>(Editor: EditorRelaxedConstructor, elementOrMap: HTMLElement | Record<string, HTMLElement>, config: C): C;
//# sourceMappingURL=assign-source-elements-to-editor-config.d.ts.map