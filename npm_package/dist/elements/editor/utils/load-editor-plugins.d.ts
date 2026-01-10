import { PluginConstructor } from 'ckeditor5';
import { EditorPlugin } from '../typings';
/**
 * Loads CKEditor plugins from base and premium packages.
 * First tries to load from the base 'ckeditor5' package, then falls back to 'ckeditor5-premium-features'.
 *
 * @param plugins - Array of plugin names to load
 * @returns Promise that resolves to an array of loaded Plugin instances
 * @throws Error if a plugin is not found in either package
 */
export declare function loadEditorPlugins(plugins: EditorPlugin[]): Promise<LoadedPlugins>;
/**
 * Type representing the loaded plugins and whether premium features are available.
 */
type LoadedPlugins = {
    loadedPlugins: PluginConstructor<any>[];
    hasPremium: boolean;
};
export {};
//# sourceMappingURL=load-editor-plugins.d.ts.map