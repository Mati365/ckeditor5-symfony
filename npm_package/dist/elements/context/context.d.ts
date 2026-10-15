/**
 * The Symfony hook that mounts CKEditor context instances.
 */
export declare class ContextComponentElement extends HTMLElement {
    /**
     * The promise that resolves to the context instance created for the current connection.
     */
    private contextPromise;
    /**
     * Unregisters the error callback of the current context instance.
     */
    private offEditorError;
    /**
     * Mounts the context component.
     */
    connectedCallback(): Promise<void>;
    /**
     * Destroys the context component. Destroying the context destroys all its editors too.
     */
    disconnectedCallback(): Promise<void>;
    /**
     * Loads plugins and translations and creates the context instance.
     */
    private createContext;
}
//# sourceMappingURL=context.d.ts.map