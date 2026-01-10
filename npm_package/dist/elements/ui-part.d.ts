/**
 * UI Part hook for Symfony. It allows you to create UI parts for multi-root editors.
 */
export declare class UIPartComponentElement extends HTMLElement {
    /**
     * The promise that resolves when the UI part is mounted.
     */
    private mountedPromise;
    /**
     * Mounts the UI part component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the UI part component. Unmounts UI parts from the editor.
     */
    disconnectedCallback(): Promise<void>;
}
//# sourceMappingURL=ui-part.d.ts.map