/**
 * UI Part hook for Symfony. It allows you to create UI parts for multi-root editors.
 */
export declare class UIPartComponentElement extends HTMLElement {
    /**
     * Stops observing the editor registry and immediately runs any pending cleanup.
     */
    private unmountEffect;
    /**
     * Mounts the UI part component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the UI part component. Unmounts UI parts from the editor.
     */
    disconnectedCallback(): void;
}
//# sourceMappingURL=ui-part.d.ts.map