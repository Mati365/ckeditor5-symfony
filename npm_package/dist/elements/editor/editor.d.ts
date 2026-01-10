/**
 * The Symfony hook that manages the lifecycle of CKEditor5 instances.
 */
export declare class EditorComponentElement extends HTMLElement {
    /**
     * The promise that resolves to the editor instance.
     */
    private editorPromise;
    /**
     * Mounts the editor component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the editor instance when the component is destroyed.
     * This is important to prevent memory leaks and ensure that the editor is properly cleaned up.
     */
    disconnectedCallback(): Promise<void>;
    /**
     * Creates the CKEditor instance.
     */
    private createEditor;
}
//# sourceMappingURL=editor.d.ts.map