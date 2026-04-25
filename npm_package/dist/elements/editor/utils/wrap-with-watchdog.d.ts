import { Editor, EditorWatchdog, WatchdogConfig } from 'ckeditor5';
/**
 * Wraps an editor factory with a watchdog for automatic recovery.
 * The factory is invoked on each (re)start, so configuration is rebuilt every time.
 *
 * @param factory Async function that creates and returns an Editor instance.
 * @param watchdogConfig Configuration of the watchdog.
 * @returns The watchdog instance.
 */
export declare function wrapWithWatchdog(factory: () => Promise<Editor>, watchdogConfig?: WatchdogConfig | null): Promise<EditorWatchdog<Editor>>;
/**
 * Unwraps the EditorWatchdog from the editor instance.
 */
export declare function unwrapEditorWatchdog(editor: Editor): EditorWatchdog | null;
//# sourceMappingURL=wrap-with-watchdog.d.ts.map