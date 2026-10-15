import { CKEditorError, ClassicEditor, Context, ContextPlugin, Plugin } from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createContextSnapshot,
  DEFAULT_TEST_CONTEXT_ID,
  renderTestContext,
  renderTestEditor,
  waitForDestroyAllEditors,
  waitForTestContext,
  waitForTestEditor,
} from '~/test-utils';

import { timeout } from '../../shared';
import { CustomEditorPluginsRegistry } from '../editor/custom-editor-plugins';
import { EditorsRegistry } from '../editor/editors-registry';
import { registerCustomElements } from '../register-custom-elements';
import { ContextsRegistry } from './contexts-registry';

describe('context component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    registerCustomElements();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.resetAllMocks();

    document.body.innerHTML = '';

    await waitForDestroyAllEditors();

    vi.restoreAllMocks();
  });

  describe('mount', () => {
    it('should save the context instance in the registry with provided id', async () => {
      renderTestContext({ contextId: 'my-context' });

      const context = await ContextsRegistry.the.waitFor('my-context');

      expect(context).toBeInstanceOf(Context);
    });

    it('should initialize context with empty creator config', async () => {
      renderTestContext(createContextSnapshot(DEFAULT_TEST_CONTEXT_ID, {
        config: {},
      }));

      expect(await waitForTestContext()).toBeInstanceOf(Context);
    });

    it('should initialize custom plugins passed to context', async () => {
      class CustomPlugin extends ContextPlugin {
        static get pluginName() {
          return 'CustomPlugin';
        }
      }

      CustomEditorPluginsRegistry.the.register('CustomPlugin', () => CustomPlugin);

      renderTestContext(createContextSnapshot(DEFAULT_TEST_CONTEXT_ID, {
        config: {
          plugins: ['CustomPlugin'],
        },
      }));

      const context = await waitForTestContext();

      expect(context.plugins.get('CustomPlugin')).toBeInstanceOf(CustomPlugin);
    });

    it('registered plugins should support custom translations', async () => {
      class CustomPlugin extends ContextPlugin {
        static get pluginName() {
          return 'CustomPlugin';
        }

        getHelloTitle() {
          return this.context.t('HELLO');
        }
      }

      CustomEditorPluginsRegistry.the.register('CustomPlugin', () => CustomPlugin);

      renderTestContext(createContextSnapshot(DEFAULT_TEST_CONTEXT_ID, {
        customTranslations: {
          en: {
            HELLO: 'Hello from CustomPlugin',
          },
        },
        config: {
          plugins: ['CustomPlugin'],
        },
      }));

      const context = await waitForTestContext();
      const plugin = context.plugins.get('CustomPlugin') as CustomPlugin;

      expect(plugin.getHelloTitle()).toBe('Hello from CustomPlugin');
    });

    it('should support custom language for context translations', async () => {
      class CustomPlugin extends ContextPlugin {
        static get pluginName() {
          return 'CustomPlugin';
        }

        getHelloTitle() {
          return this.context.t('HELLO');
        }
      }

      CustomEditorPluginsRegistry.the.register('CustomPlugin', () => CustomPlugin);

      renderTestContext(createContextSnapshot(
        DEFAULT_TEST_CONTEXT_ID,
        {
          customTranslations: {
            en: {
              HELLO: 'Hello from CustomPlugin',
            },
            pl: {
              HELLO: 'Witaj z CustomPlugin',
            },
          },
          config: {
            plugins: ['CustomPlugin'],
          },
        },
        {
          ui: 'pl',
          content: 'pl',
        },
      ));

      const context = await waitForTestContext();
      const plugin = context.plugins.get('CustomPlugin') as CustomPlugin;

      expect(plugin.getHelloTitle()).toBe('Witaj z CustomPlugin');
    });

    it('should resolve $translation references in the context configuration', async () => {
      renderTestContext(
        createContextSnapshot(
          DEFAULT_TEST_CONTEXT_ID,
          {
            customTranslations: {
              en: {
                Custom: 'Custom value',
              },
              pl: {
                Custom: 'Wartość niestandardowa',
              },
            },
            config: {
              customPlugin: {
                label: { $translation: 'Custom' },
              },
            },
          },
          {
            ui: 'pl',
            content: 'pl',
          },
        ),
      );

      const context = await waitForTestContext();

      expect((context.config.get('customPlugin') as any).label).toBe('Wartość niestandardowa');
    });
  });

  describe('mount errors', () => {
    // A regular editor plugin is rejected by `Context.create()`, which gives a real creation failure.
    class NotAContextPlugin extends Plugin {
      static pluginName = 'NotAContextPlugin';
    }

    const renderBrokenContext = () => renderTestContext(createContextSnapshot(DEFAULT_TEST_CONTEXT_ID, {
      config: {
        plugins: ['NotAContextPlugin'],
      },
    }));

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      CustomEditorPluginsRegistry.the.register('NotAContextPlugin', () => NotAContextPlugin);
    });

    afterEach(() => {
      // Errors are not cleared by destroying items. Clearing them also clears the default (`null`) error,
      // so they do not leak into tests that wait for the default context or editor.
      ContextsRegistry.the.resetErrors(DEFAULT_TEST_CONTEXT_ID);
      EditorsRegistry.the.resetErrors('editor-in-broken-context');
    });

    it('should log and register the error if the context cannot be created', async () => {
      renderBrokenContext();

      await expect(ContextsRegistry.the.waitFor(DEFAULT_TEST_CONTEXT_ID)).rejects.toThrow('context-initplugins-invalid-plugin');

      expect(ContextsRegistry.the.hasItem(DEFAULT_TEST_CONTEXT_ID)).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        `Error initializing CKEditor5 context with ID "${DEFAULT_TEST_CONTEXT_ID}":`,
        expect.anything(),
      );
    });

    it('should reject editors waiting for the context that cannot be created', async () => {
      renderBrokenContext();
      renderTestEditor({
        editorId: 'editor-in-broken-context',
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      await expect(EditorsRegistry.the.waitFor('editor-in-broken-context')).rejects.toThrow('context-initplugins-invalid-plugin');
    });

    it('should not fail when removing the element of the context that could not be created', async () => {
      const el = renderBrokenContext();

      await expect(ContextsRegistry.the.waitFor(DEFAULT_TEST_CONTEXT_ID)).rejects.toThrow();

      // Rejects (and fails the run as unhandled) if the creation error is not swallowed on disconnect.
      el.remove();
      await timeout(0);

      expect(el.style.display).toBe('none');
    });

    it('should be possible to mount the context again after a failed initialization', async () => {
      const brokenEl = renderBrokenContext();

      await expect(ContextsRegistry.the.waitFor(DEFAULT_TEST_CONTEXT_ID)).rejects.toThrow();

      brokenEl.remove();

      renderTestContext();

      // Errors are reset once the DOM is ready, so wait for the new context instead of failing immediately.
      await expect.poll(() => ContextsRegistry.the.hasItem(DEFAULT_TEST_CONTEXT_ID)).toBe(true);
      expect(await waitForTestContext()).toBeInstanceOf(Context);
    });
  });

  describe('errors of the running context', () => {
    /**
     * Reports an error attributed to the context the same way the browser does for an uncaught error.
     */
    const reportContextError = (context: Context) => {
      const error = new CKEditorError('test-context-error', context);

      window.dispatchEvent(new ErrorEvent('error', { error }));

      return error;
    };

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log the error and switch editors of the context to read-only mode', async () => {
      renderTestContext();
      renderTestEditor({
        editorId: 'editor-in-failing-context',
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const context = await waitForTestContext();
      const editor = await waitForTestEditor('editor-in-failing-context');

      expect(editor.isReadOnly).toBe(false);

      const error = reportContextError(context);

      expect(console.error).toHaveBeenCalledWith(`CKEditor5 context with ID "${DEFAULT_TEST_CONTEXT_ID}" failed.`, error);
      expect(editor.isReadOnly).toBe(true);
    });

    it('should ignore errors attributed to other contexts', async () => {
      renderTestContext({ contextId: 'healthy-context' });
      renderTestContext({ contextId: 'other-failing-context' });
      renderTestEditor({
        editorId: 'editor-in-healthy-context',
        contextId: 'healthy-context',
      });

      const failingContext = await ContextsRegistry.the.waitFor('other-failing-context');
      const healthyEditor = await waitForTestEditor('editor-in-healthy-context');

      reportContextError(failingContext);

      expect(console.error).toHaveBeenCalledWith('CKEditor5 context with ID "other-failing-context" failed.', expect.anything());
      expect(console.error).not.toHaveBeenCalledWith('CKEditor5 context with ID "healthy-context" failed.', expect.anything());
      expect(healthyEditor.isReadOnly).toBe(false);
    });
  });

  describe('attaching editor', () => {
    it('should not attach editor to the context (editor has no specified context, context initialized)', async () => {
      renderTestContext();

      const context = await waitForTestContext();

      renderTestEditor();

      await waitForTestEditor();

      expect(context.editors.first).toBeNull();
    });

    it('should attach editor to the context (editor has specified context, context initialized)', async () => {
      renderTestContext();

      const context = await waitForTestContext();

      renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const editor = await waitForTestEditor();

      expect(context.editors.first).toEqual(editor);
    });

    it('should pause editor initialization when context is not yet initialized', async () => {
      renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      await timeout(50);

      renderTestContext();

      const context = await waitForTestContext();
      const editor = await waitForTestEditor();

      expect(context.editors.first).toEqual(editor);
    });

    it('should be possible to attach multiple editors to the same context', async () => {
      renderTestContext();

      const context = await waitForTestContext();

      renderTestEditor({
        editorId: 'editor-1',
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      renderTestEditor({
        editorId: 'editor-2',
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const editors = await Promise.all([
        waitForTestEditor('editor-1'),
        waitForTestEditor('editor-2'),
      ]);

      expect(context.editors.length).toBe(2);
      expect([...context.editors]).toEqual(editors);
    });
  });

  describe('destroy', () => {
    it('destroyed editor is removed from the context editors collection', async () => {
      renderTestContext();

      const context = await waitForTestContext();

      const editorEl = renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const editor = await waitForTestEditor();

      expect(context.editors.first).toEqual(editor);

      editorEl.remove();

      await expect.poll(() => context.editors.first).toBeNull();
    });

    it('should remove the context instance from the registry and destroy it on destroy', async () => {
      const el = renderTestContext({ contextId: 'my-context' });

      const context = await ContextsRegistry.the.waitFor('my-context');
      const destroySpy = vi.spyOn(context, 'destroy');

      el.remove();

      await expect.poll(() => ContextsRegistry.the.hasItem('my-context')).toBe(false);
      await expect.poll(() => destroySpy.mock.calls.length).toBe(1);
    });

    it('should log and swallow errors thrown while destroying the context', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const el = renderTestContext({ contextId: 'failing-destroy-context' });

      const context = await ContextsRegistry.the.waitFor('failing-destroy-context');
      const error = new Error('Destroy failed');
      const destroySpy = vi.spyOn(context, 'destroy').mockRejectedValueOnce(error);

      // `disconnectedCallback()` is not awaited, so a rejection here would be unhandled (and fail the run).
      el.remove();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to destroy CKEditor5 context with ID "failing-destroy-context".', error);
      });

      // The context is not registered anymore, so the cleanup won't destroy it.
      destroySpy.mockRestore();
      await context.destroy();
    });

    it('should hide element during destruction', async () => {
      const el = renderTestContext();

      el.remove();

      expect(el.style.display).toBe('none');
    });

    it('should not create the context if the element is removed before the DOM is ready', async () => {
      const createSpy = vi.spyOn(Context, 'create');
      const el = renderTestContext();

      el.remove();

      await timeout(50);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should destroy the context and skip registration if the element is removed during creation', async () => {
      const destroySpy = vi.spyOn(Context.prototype, 'destroy');
      const registerSpy = vi.spyOn(ContextsRegistry.the, 'register');

      let releaseInit!: () => void;
      const initGate = new Promise<void>((resolve) => {
        releaseInit = resolve;
      });

      let initStarted = false;

      // Keeps the context being created until the element is removed.
      class SlowContextPlugin extends ContextPlugin {
        static get pluginName() {
          return 'SlowContextPlugin';
        }

        async init() {
          initStarted = true;
          await initGate;
        }
      }

      CustomEditorPluginsRegistry.the.register('SlowContextPlugin', () => SlowContextPlugin);

      const el = renderTestContext(createContextSnapshot('short-lived-context', {
        config: {
          plugins: ['SlowContextPlugin'],
        },
      }));

      await expect.poll(() => initStarted).toBe(true);

      el.remove();
      releaseInit();

      await expect.poll(() => destroySpy.mock.calls.length).toBe(1);

      expect(registerSpy).not.toHaveBeenCalled();
      expect(ContextsRegistry.the.hasItem('short-lived-context')).toBe(false);
    });

    it('should not unregister the context of a new element with the same id when the old one is destroyed', async () => {
      const destroySpy = vi.spyOn(Context.prototype, 'destroy');

      let releaseFirstInit!: () => void;
      const firstInitGate = new Promise<void>((resolve) => {
        releaseFirstInit = resolve;
      });

      let initializedPlugins = 0;

      // Only the first (old) context is kept being created until the new one is registered.
      class GatedContextPlugin extends ContextPlugin {
        static get pluginName() {
          return 'GatedContextPlugin';
        }

        async init() {
          if (initializedPlugins++ === 0) {
            await firstInitGate;
          }
        }
      }

      CustomEditorPluginsRegistry.the.register('GatedContextPlugin', () => GatedContextPlugin);

      const snapshot = createContextSnapshot('replaced-context', {
        config: {
          plugins: ['GatedContextPlugin'],
        },
      });

      const oldEl = renderTestContext(snapshot);

      await expect.poll(() => initializedPlugins).toBe(1);

      // Simulate replacing the element with a new one with the same id.
      oldEl.remove();
      renderTestContext(snapshot);

      const newContext = await ContextsRegistry.the.waitFor('replaced-context');

      releaseFirstInit();

      // The old context is destroyed by its element.
      await expect.poll(() => destroySpy.mock.calls.length).toBe(1);

      expect(ContextsRegistry.the.getItem('replaced-context')).toBe(newContext);
    });

    it('destroying context should destroy all attached editors', async () => {
      const contextEl = renderTestContext();

      await waitForTestContext();

      const editorEl = renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });
      const editorId = editorEl.getAttribute('data-cke-editor-id')!;

      const editor = await waitForTestEditor();

      expect(editor.state).toBe('ready');

      contextEl.remove();

      await expect.poll(() => editor.state).toBe('destroyed');

      expect(ContextsRegistry.the.hasItem(DEFAULT_TEST_CONTEXT_ID)).toBe(false);
      await expect.poll(() => EditorsRegistry.the.hasItem(editorId)).toBe(false);
    });

    it.each([
      ['context before editor', false],
      ['editor before context', true],
    ])('should destroy the editor only once when removed together with its context (%s)', async (_, editorFirst) => {
      // Spied before creation, so the spy is what the idempotent `destroy()` wraps.
      const destroySpy = vi.spyOn(ClassicEditor.prototype, 'destroy');

      // Order of elements in the DOM decides the order of `disconnectedCallback()` calls.
      if (editorFirst) {
        renderTestEditor({ contextId: DEFAULT_TEST_CONTEXT_ID });
        renderTestContext();
      }
      else {
        renderTestContext();
        renderTestEditor({ contextId: DEFAULT_TEST_CONTEXT_ID });
      }

      const context = await waitForTestContext();

      await waitForTestEditor();

      document.body.innerHTML = '';

      await expect.poll(() => context.editors.length).toBe(0);

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });
  });
});
