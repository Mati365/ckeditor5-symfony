import type { Editor } from 'ckeditor5';

import type { EditorId, EditorLanguage, EditorPreset } from './typings';
import type {
  EditableItem,
} from './utils';

import { isEmptyObject, waitFor, waitForDOMReady } from '../../shared';
import { ContextsRegistry } from '../context';
import { EditorsRegistry } from './editors-registry';
import {
  createDispatchEditorRootsChangeEventPlugin,
  createSyncEditorWithInputPlugin,
} from './plugins';
import {
  assignEditorRootsToConfig,
  createEditorInContext,
  isSingleRootEditor,
  loadAllEditorTranslations,
  loadEditorConstructor,
  loadEditorPlugins,
  normalizeCustomTranslations,
  queryAllEditorEditables,
  resolveEditorConfigElementReferences,
  resolveEditorConfigTranslations,
  setEditorEditableHeight,
  unwrapEditorContext,
  unwrapEditorWatchdog,
  wrapWithWatchdog,
} from './utils';

/**
 * The Symfony hook that manages the lifecycle of CKEditor5 instances.
 */
export class EditorComponentElement extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  private unmountEffect: VoidFunction | null = null;

  /**
   * Mounts the editor component.
   */
  async connectedCallback(): Promise<void> {
    await waitForDOMReady();
    await this.initializeEditor();
  }

  /**
   * Initializes the editor instance.
   */
  private async initializeEditor(): Promise<void> {
    const editorId = this.getAttribute('data-cke-editor-id')!;

    EditorsRegistry.the.resetErrors(editorId);

    try {
      this.style.display = 'block';

      const editor = await this.createEditor();
      const editorContext = unwrapEditorContext(editor);
      const watchdog = unwrapEditorWatchdog(editor);

      // Do not even try to broadcast about the registration of the editor
      // if hook was immediately destroyed.
      if (this.isConnected) {
        // Run some stuff that have to be reinitialized every-time editor is being restarted.
        const unmountDestroyWatchers = EditorsRegistry.the.mountEffect(editorId, (editor) => {
          // Enforce deregistration of the editor when it's being destroyed by watchdog.
          editor.once('destroy', () => {
            // Let's handle case when watchdog destroyed editor "externally" or user manually
            // called `.destroy()`. Keep pending callbacks though.
            EditorsRegistry.the.unregister(editorId, false);
          }, { priority: 'highest' });
        });

        this.unmountEffect = async () => {
          // If for some reason editor not fired `destroy`, enforce deregistration.
          EditorsRegistry.the.unregister(editorId);
          unmountDestroyWatchers();

          if (editorContext) {
            // If context is present, make sure it's not in unmounting phase, as it'll kill the editors.
            // If it's being destroyed, don't do anything, as the context will take care of it.
            if (editorContext.state !== 'unavailable') {
              await editorContext.context.remove(editorContext.editorContextId);
            }
          }
          else if (watchdog) {
            await watchdog.destroy();
          }
          else {
            await editor.destroy();
          }
        };

        EditorsRegistry.the.register(editorId, editor);
      }
      /* v8 ignore next 7 */
    }
    catch (error: any) {
      console.error(`Error initializing CKEditor5 instance with ID "${editorId}":`, error);
      this.unmountEffect = null;
      EditorsRegistry.the.error(editorId, error);
    }
  }

  /**
   * Destroys the editor instance when the component is destroyed.
   * This is important to prevent memory leaks and ensure that the editor is properly cleaned up.
   */
  disconnectedCallback() {
    // Let's hide the element during destruction to prevent flickering.
    this.style.display = 'none';

    // Stop observing the registry and run cleanup immediately.
    this.unmountEffect?.();
    this.unmountEffect = null;
  }

  /**
   * Creates the CKEditor instance.
   */
  private async createEditor(): Promise<Editor> {
    const editorId = this.getAttribute('data-cke-editor-id')!;
    const preset = JSON.parse(this.getAttribute('data-cke-preset')!) as EditorPreset;
    const contextId = this.getAttribute('data-cke-context-id');
    const editableHeight = this.getAttribute('data-cke-editable-height') ? Number.parseInt(this.getAttribute('data-cke-editable-height')!, 10) : null;
    const saveDebounceMs = Number.parseInt(this.getAttribute('data-cke-save-debounce-ms')!, 10);
    const language = JSON.parse(this.getAttribute('data-cke-language')!) as EditorLanguage;
    const useWatchdog = this.hasAttribute('data-cke-watchdog');

    const {
      customTranslations,
      editorType,
      licenseKey,
      watchdogConfig,
      config: { plugins, ...config },
    } = preset;

    const Constructor = await loadEditorConstructor(editorType);
    const context = await (
      contextId
        ? ContextsRegistry.the.waitFor(contextId)
        : null
    );

    /**
     * Builds the full editor configuration and creates the editor instance.
     */
    const buildAndCreateEditor = async () => {
      const { loadedPlugins, hasPremium } = await loadEditorPlugins(plugins);

      loadedPlugins.push(
        await createDispatchEditorRootsChangeEventPlugin({
          saveDebounceMs,
          editorId,
          targetElement: this,
        }),
      );

      if (isSingleRootEditor(editorType)) {
        loadedPlugins.push(
          await createSyncEditorWithInputPlugin(saveDebounceMs),
        );
      }

      // Mix custom translations with loaded translations.
      const loadedTranslations = await loadAllEditorTranslations(language, hasPremium);
      const mixedTranslations = [
        ...loadedTranslations,
        normalizeCustomTranslations(customTranslations || {}),
      ]
        .filter(translations => !isEmptyObject(translations));

      // Query all editable elements along with their content in one pass.
      // Roots present in the editor container's data-cke-content but not yet in the DOM
      // are included with element: null so we know which roots to wait for.
      let editables = queryAllEditorEditables(editorId);
      const requiredRoots = Object.keys(editables);

      if (isSingleRootEditor(editorType)) {
        requiredRoots.push('main');
      }

      if (!checkIfAllRootsArePresent(editables, requiredRoots)) {
        editables = await waitForAllRootsToBePresent(editorId, requiredRoots);
      }

      // Do some postprocessing on received configuration.
      let resolvedConfig = {
        ...config,
        licenseKey,
        plugins: loadedPlugins,
        language,
        ...mixedTranslations.length && {
          translations: mixedTranslations,
        },
      };

      resolvedConfig = resolveEditorConfigElementReferences(resolvedConfig);
      resolvedConfig = resolveEditorConfigTranslations([...mixedTranslations].reverse(), language.ui, resolvedConfig);
      resolvedConfig = assignEditorRootsToConfig(Constructor, editables, resolvedConfig);

      // Depending of the editor type, and parent lookup for nearest context or initialize it without it.
      const editor = await (async () => {
        if (!context) {
          return Constructor.create(resolvedConfig);
        }

        const result = await createEditorInContext({
          context,
          creator: Constructor,
          config: resolvedConfig,
        });

        return result.editor;
      })();

      if (isSingleRootEditor(editorType) && editableHeight) {
        setEditorEditableHeight(editor, editableHeight);
      }

      return editor;
    };

    // Do not use editor specific watchdog if context is attached, as the context is by default protected.
    if (useWatchdog && !context) {
      const watchdogInstance = await wrapWithWatchdog(buildAndCreateEditor, watchdogConfig);

      watchdogInstance.on('restart', () => {
        const newInstance = watchdogInstance.editor!;

        EditorsRegistry.the.register(editorId, newInstance);
      });

      await watchdogInstance.create({});

      return watchdogInstance.editor!;
    }

    return buildAndCreateEditor();
  }
}

/**
 * Checks if all required root elements are present (i.e. have a non-null element) in the editables map.
 *
 * @param editables The editables map keyed by root name.
 * @param requiredRoots The list of required root names.
 * @returns True if all required roots have a DOM element attached, false otherwise.
 */
function checkIfAllRootsArePresent(editables: Record<string, EditableItem>, requiredRoots: string[]): boolean {
  return requiredRoots.every(rootId => editables[rootId]?.element);
}

/**
 * Waits for all required root elements to be present in the DOM.
 *
 * @param editorId The editor's ID.
 * @param requiredRoots The list of required root names.
 * @returns A promise that resolves to the updated editables map once all elements are attached.
 */
async function waitForAllRootsToBePresent(
  editorId: EditorId,
  requiredRoots: string[],
): Promise<Record<string, EditableItem>> {
  return waitFor(
    () => {
      const editables = queryAllEditorEditables(editorId);

      if (!checkIfAllRootsArePresent(editables, requiredRoots)) {
        throw new Error(
          'It looks like not all required root elements are present yet.\n'
          + '* If you want to wait for them, ensure they are registered before editor initialization.\n'
          + '* If you want lazy initialize roots, consider removing root values from the `initialData` config '
          + 'and assign initial data in editable components.\n'
          + `Missing roots: ${requiredRoots.filter(rootId => !editables[rootId]?.element).join(', ')}.`,
        );
      }

      return editables;
    },
    { timeOutAfter: 2000, retryAfter: 100 },
  );
}
