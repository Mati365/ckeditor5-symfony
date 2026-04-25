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
     * Batch nesting depth. When > 0, watcher notifications are deferred.
     */
    private batchDepth;
    /**
     * Snapshot of the last state dispatched to watchers, used for change detection.
     */
    private lastNotifiedItems;
    private lastNotifiedErrors;
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
     * Reactively binds a mount/unmount lifecycle to a single registry item.
     *
     * @param id The ID of the item to observe.
     * @param onMount Function executed when the item mounts.
     * @returns A function that stops observing and immediately runs any pending cleanup.
     */
    mountEffect<E extends T = T>(id: RegistryId | null, onMount: (item: E) => (() => void) | void): () => void;
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
     * @param resetPendingCallbacks If true resets pending callbacks.
     */
    unregister(id: RegistryId | null, resetPendingCallbacks?: boolean): void;
    /**
     * Gets all registered items.
     *
     * @returns An array of all registered items.
     */
    getItems(): T[];
    /**
     * Returns single registered item.
     *
     * @returns Registered item.
     */
    getItem(id: RegistryId | null): T | undefined;
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
     * @returns A promise that resolves with the item instance.
     */
    waitFor<E extends T = T>(id: RegistryId | null): Promise<E>;
    /**
     * Destroys all registered items and clears the registry.
     * This will call the `destroy` method on each item.
     */
    destroyAll(): Promise<void>;
    /**
     * Destroys all registered editors and removes all watchers.
     */
    reset(): Promise<void>;
    /**
     * Executes a callback while deferring all watcher notifications.
     * A single notification is fired synchronously after the callback returns,
     * but only if the registry actually changed.
     *
     * Batches can be nested — watchers are notified only when the outermost
     * batch completes.
     *
     * @param fn The callback to execute.
     * @returns The return value of the callback.
     */
    batch<R>(fn: () => R): R;
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
     * Immediately dispatches the current state to all watchers if it changed.
     */
    private flushWatchers;
    /**
     * Gets or creates pending callbacks for a specific ID.
     *
     * @param id The ID of the item.
     * @returns The pending callbacks structure.
     */
    private getPendingCallbacks;
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