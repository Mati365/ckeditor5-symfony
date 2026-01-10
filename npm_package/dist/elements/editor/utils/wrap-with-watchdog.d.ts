import { Editor, EditorWatchdog } from 'ckeditor5';
/**
 * Wraps an Editor creator with a watchdog for automatic recovery.
 *
 * @param Editor - The Editor creator to wrap.
 * @returns The Editor creator wrapped with a watchdog.
 */
export declare function wrapWithWatchdog(Editor: EditorCreator): Promise<{
    watchdog: EditorWatchdog<Editor>;
    Constructor: {
        create: (...args: Parameters<(typeof Editor)["create"]>) => Promise<Editor>;
    };
}>;
/**
 * Unwraps the EditorWatchdog from the editor instance.
 */
export declare function unwrapEditorWatchdog(editor: Editor): EditorWatchdog | null;
/**
 * Type representing an Editor creator with a create method.
 */
export type EditorCreator = {
    create: (...args: any) => Promise<Editor>;
};
//# sourceMappingURL=wrap-with-watchdog.d.ts.map