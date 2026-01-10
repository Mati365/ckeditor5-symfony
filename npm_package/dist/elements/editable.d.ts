/**
 * Editable hook for Symfony. It allows you to create editables for multi-root editors.
 */
export declare class EditableComponentElement extends HTMLElement {
    /**
     * The promise that resolves when the editable is mounted.
     */
    private editorPromise;
    /**
     * Mounts the editable component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the editable component. Unmounts root from the editor.
     */
    disconnectedCallback(): Promise<void>;
}
//# sourceMappingURL=editable.d.ts.map