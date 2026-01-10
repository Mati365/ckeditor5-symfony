/**
 * Generic async registry for objects with an async destroy method.
 * Provides a way to register, unregister, and execute callbacks on objects by ID.
 */
export declare class AsyncRegistry<T extends Destructible> {
    /**
     * Map of registered items.
     */
    private readonly items;
    /**
     * Map of initialization errors for items that failed to register.
     */
    private readonly initializationErrors;
    /**
     * Map of pending callbacks waiting for items to be registered or fail.
     */
    private readonly pendingCallbacks;
    /**
     * Set of watchers that observe changes to the registry.
     */
    private readonly watchers;
    /**
     * Executes a function on an item.
     * If the item is not yet registered, it will wait for it to be registered.
     *
     * @param id The ID of the item.
     * @param onSuccess The function to execute.
     * @param onError Optional error callback.
     * @returns A promise that resolves with the result of the function.
     */
    execute<R, E extends T = T>(id: RegistryId | null, onSuccess: (item: E) => R, onError?: (error: any) => void): Promise<Awaited<R>>;
    /**
     * Registers an item.
     *
     * @param id The ID of the item.
     * @param item The item instance.
     */
    register(id: RegistryId | null, item: T): void;
    /**
     * Registers an error for an item.
     *
     * @param id The ID of the item.
     * @param error The error to register.
     */
    error(id: RegistryId | null, error: any): void;
    /**
     * Resets errors for an item.
     *
     * @param id The ID of the item.
     */
    resetErrors(id: RegistryId | null): void;
    /**
     * Un-registers an item.
     *
     * @param id The ID of the item.
     */
    unregister(id: RegistryId | null): void;
    /**
     * Gets all registered items.
     *
     * @returns An array of all registered items.
     */
    getItems(): T[];
    /**
     * Checks if an item with the given ID is registered.
     *
     * @param id The ID of the item.
     * @returns `true` if the item is registered, `false` otherwise.
     */
    hasItem(id: RegistryId | null): boolean;
    /**
     * Gets a promise that resolves with the item instance for the given ID.
     * If the item is not registered yet, it will wait for it to be registered.
     *
     * @param id The ID of the item.
     * @param timeout Optional timeout in milliseconds.
     * @returns A promise that resolves with the item instance.
     */
    waitFor<E extends T = T>(id: RegistryId | null, timeout?: number): Promise<E>;
    /**
     * Destroys all registered items and clears the registry.
     * This will call the `destroy` method on each item.
     */
    destroyAll(): Promise<void>;
    /**
     * Registers a watcher that will be called whenever the registry changes.
     *
     * @param watcher The watcher function to register.
     * @returns A function to unregister the watcher.
     */
    watch(watcher: RegistryWatcher<T>): () => void;
    /**
     * Un-registers a watcher.
     *
     * @param watcher The watcher function to unregister.
     */
    unwatch(watcher: RegistryWatcher<T>): void;
    /**
     * Resets the registry by clearing all items, errors, and pending callbacks.
     */
    reset(): void;
    /**
     * Notifies all watchers about changes to the registry.
     */
    private notifyWatchers;
    /**
     * Gets or creates pending callbacks for a specific ID.
     *
     * @param id The ID of the item.
     * @returns The pending callbacks structure.
     */
    private getPendingCallbacks;
    /**
     * Registers an item as the default (null ID) item if it's the first one.
     *
     * @param id The ID of the item being registered.
     * @param item The item instance.
     */
    private registerAsDefault;
}
/**
 * Interface for objects that can be destroyed.
 */
export type Destructible = {
    destroy: () => Promise<any>;
};
/**
 * Identifier of the registry item.
 */
type RegistryId = string;
/**
 * Callback type for watching registry changes.
 */
type RegistryWatcher<T> = (items: Map<RegistryId | null, T>, errors: Map<RegistryId | null, Error>) => void;
export {};
//# sourceMappingURL=async-registry.d.ts.map