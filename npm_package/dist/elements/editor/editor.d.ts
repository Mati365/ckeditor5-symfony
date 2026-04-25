/**
 * The Symfony hook that manages the lifecycle of CKEditor5 instances.
 */
export declare class EditorComponentElement extends HTMLElement {
    /**
     * Stops observing the editor registry and immediately runs any pending cleanup.
     */
    private unmountEffect;
    /**
     * Mounts the editor component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Initializes the editor instance.
     */
    private initializeEditor;
    /**
     * Destroys the editor instance when the component is destroyed.
     * This is important to prevent memory leaks and ensure that the editor is properly cleaned up.
     */
    disconnectedCallback(): void;
    /**
     * Creates the CKEditor instance.
     */
    private createEditor;
}
//# sourceMappingURL=editor.d.ts.map