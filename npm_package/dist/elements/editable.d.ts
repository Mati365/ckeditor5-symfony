/**
 * Editable hook for Symfony. It allows you to create editables for multi-root editors.
 */
export declare class EditableComponentElement extends HTMLElement {
    /**
     * Stops observing the editor registry and immediately runs any pending cleanup.
     */
    private unmountEffect;
    /**
     * Mounts the editable component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the editable component. Unmounts root from the editor.
     */
    disconnectedCallback(): void;
}
//# sourceMappingURL=editable.d.ts.map