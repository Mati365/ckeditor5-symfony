import { PluginConstructor } from 'ckeditor5';
import { CanBePromise } from '../../types';
type PluginReader = () => CanBePromise<PluginConstructor>;
/**
 * Registry for custom CKEditor plugins.
 * Allows registration and retrieval of custom plugins that can be used alongside built-in plugins.
 */
export declare class CustomEditorPluginsRegistry {
    static readonly the: CustomEditorPluginsRegistry;
    /**
     * Map of registered custom plugins.
     */
    private readonly plugins;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * Registers a custom plugin for the CKEditor.
     *
     * @param name The name of the plugin.
     * @param reader The plugin reader function that returns the plugin constructor.
     * @returns A function to unregister the plugin.
     */
    register(name: string, reader: PluginReader): () => void;
    /**
     * Removes a custom plugin by its name.
     *
     * @param name The name of the plugin to unregister.
     * @throws Will throw an error if the plugin is not registered.
     */
    unregister(name: string): void;
    /**
     * Removes all custom editor plugins.
     * This is useful for cleanup in tests or when reloading plugins.
     */
    unregisterAll(): void;
    /**
     * Retrieves a custom plugin by its name.
     *
     * @param name The name of the plugin.
     * @returns The plugin constructor or undefined if not found.
     */
    get(name: string): Promise<PluginConstructor | undefined>;
    /**
     * Checks if a plugin with the given name is registered.
     *
     * @param name The name of the plugin.
     * @returns `true` if the plugin is registered, `false` otherwise.
     */
    has(name: string): boolean;
}
export {};
//# sourceMappingURL=custom-editor-plugins.d.ts.map