import type { Context, Editor } from 'ckeditor5';

import type { EditorId, EditorLanguage, EditorPreset } from './typings';
import type {
  EditableItem,
} from './utils';

import { isEmptyObject, makeDestroyIdempotent, waitFor, waitForDOMReady } from '../../shared';
import { ContextsRegistry } from '../context';
import { EditorsRegistry } from './editors-registry';
import {
  createDispatchEditorRootsChangeEventPlugin,
  createSyncEditorWithInputPlugin,
} from './plugins';
import {
  assignEditorRootsToConfig,
  isSingleRootEditor,
  loadAllEditorTranslations,
  loadEditorConstructor,
  loadEditorPlugins,
  normalizeCustomTranslations,
  queryAllEditorEditables,
  resolveEditorConfigElementReferences,
  resolveEditorConfigTranslations,
  setEditorEditableHeight,
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

    // Removed while waiting for the DOM.
    if (!this.isConnected) {
      return;
    }

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

      const [editor, { onEditorError }] = await Promise.all([
        this.createEditor(),
        import('ckeditor5'),
      ]);

      // Removed while the editor was being created. Nobody else will destroy it.
      if (!this.isConnected) {
        await destroyEditorSafely(editorId, editor);
        return;
      }

      // Nothing restarts the editor after a crash anymore and its state may be inconsistent,
      // so lock it in read-only mode to avoid syncing broken data with the form.
      // Errors of the context are handled by the context component.
      const offEditorError = onEditorError(({ error, source }) => {
        if (source !== editor) {
          return;
        }

        console.error(`CKEditor5 instance with ID "${editorId}" failed.`, error);
        editor.enableReadOnlyMode('error-handling');
      });

      // Bind lifecycle of the integration to the registered editor instance.
      const unmountDestroyWatchers = EditorsRegistry.the.mountEffect(editorId, (editor) => {
        // Enforce deregistration of the editor when it's destroyed externally (for example by its context
        // or manually using `.destroy()`). Keep pending callbacks though.
        editor.once('destroy', () => {
          EditorsRegistry.the.unregister(editorId, false);
        }, { priority: 'highest' });
      });

      this.unmountEffect = () => {
        // If for some reason editor not fired `destroy`, enforce deregistration.
        EditorsRegistry.the.unregister(editorId);
        unmountDestroyWatchers();
        offEditorError();

        void destroyEditorSafely(editorId, editor);
      };

      EditorsRegistry.the.register(editorId, editor);
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

    const {
      customTranslations,
      editorType,
      licenseKey,
      config: { plugins, ...config },
    } = preset;

    const Constructor = await loadEditorConstructor(editorType);
    const context: Context | null = await (
      contextId
        ? ContextsRegistry.the.waitFor(contextId)
        : null
    );

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

    const editor = await Constructor.create(
      context
        ? { ...resolvedConfig, context }
        : resolvedConfig,
    );

    if (isSingleRootEditor(editorType) && editableHeight) {
      setEditorEditableHeight(editor, editableHeight);
    }

    // The editor may be destroyed both by this component and by its context (when they're disconnected
    // in the same DOM update, in any order), or by `EditorsRegistry#destroyAll()`.
    return makeDestroyIdempotent(editor);
  }
}

/**
 * Destroys the editor. Never rejects, because callers (like `disconnectedCallback()`) are not awaited.
 *
 * @param editorId The editor's ID (used for logging).
 * @param editor The editor instance.
 */
async function destroyEditorSafely(editorId: EditorId, editor: Editor): Promise<void> {
  try {
    await editor.destroy();
  }
  catch (error) {
    console.error(`Failed to destroy CKEditor5 instance with ID "${editorId}".`, error);
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
