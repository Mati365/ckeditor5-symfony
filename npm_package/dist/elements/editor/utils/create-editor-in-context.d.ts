import { Context, ContextWatchdog, Editor, EditorConfig } from 'ckeditor5';
import { EditorCreator } from './wrap-with-watchdog';
/**
 * Creates a CKEditor 5 editor instance within a given context watchdog.
 *
 * @param params Parameters for editor creation.
 * @param params.element The DOM element or data for the editor.
 * @param params.context The context watchdog instance.
 * @param params.creator The editor creator utility.
 * @param params.config The editor configuration object.
 * @returns The created editor instance.
 */
export declare function createEditorInContext({ element, context, creator, config }: Attrs): Promise<{
    editor: Editor;
    state: "available" | "unavailable";
    editorContextId: string;
    context: ContextWatchdog<Context>;
}>;
/**
 * Retrieves the context watchdog from an editor instance, if available.
 *
 * @param editor The editor instance.
 * @returns The context watchdog or null if not found.
 */
export declare function unwrapEditorContext(editor: Editor): EditorContextDescriptor | null;
/**
 * Parameters for creating an editor in a context.
 */
type Attrs = {
    context: ContextWatchdog<Context>;
    creator: EditorCreator;
    element: HTMLElement;
    config: EditorConfig;
};
/**
 * Descriptor for an editor context.
 */
type EditorContextDescriptor = {
    state: 'available' | 'unavailable';
    editorContextId: string;
    context: ContextWatchdog<Context>;
};
export {};
//# sourceMappingURL=create-editor-in-context.d.ts.map