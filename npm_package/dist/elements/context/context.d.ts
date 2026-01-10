/**
 * The Symfony hook that mounts CKEditor context instances.
 */
export declare class ContextComponentElement extends HTMLElement {
    /**
     * The promise that resolves to the context instance.
     */
    private contextPromise;
    /**
     * Mounts the context component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the context component. Unmounts root from the editor.
     */
    disconnectedCallback(): Promise<void>;
}
//# sourceMappingURL=context.d.ts.map