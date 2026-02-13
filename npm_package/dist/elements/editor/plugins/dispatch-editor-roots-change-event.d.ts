import { PluginConstructor } from 'ckeditor5';
/**
 * Creates a DispatchEditorRootsChangeEvent plugin class.
 */
export declare function createDispatchEditorRootsChangeEventPlugin({ saveDebounceMs, editorId, targetElement, }: CreateDispatchEditorRootsChangeEventPluginParams): Promise<PluginConstructor>;
type CreateDispatchEditorRootsChangeEventPluginParams = {
    saveDebounceMs: number;
    editorId: string;
    targetElement: HTMLElement;
};
export {};
//# sourceMappingURL=dispatch-editor-roots-change-event.d.ts.map