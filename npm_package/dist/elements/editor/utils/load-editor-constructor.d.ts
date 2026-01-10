import { EditorType } from '../typings';
/**
 * Returns the constructor for the specified CKEditor5 editor type.
 *
 * @param type - The type of the editor to load.
 * @returns A promise that resolves to the editor constructor.
 */
export declare function loadEditorConstructor(type: EditorType): Promise<typeof import('ckeditor5').InlineEditor | typeof import('ckeditor5').BalloonEditor | typeof import('ckeditor5').ClassicEditor | typeof import('ckeditor5').DecoupledEditor | typeof import('ckeditor5').MultiRootEditor>;
//# sourceMappingURL=load-editor-constructor.d.ts.map