import { Context, ContextPlugin, ContextWatchdog } from 'ckeditor5';
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
  });

  describe('mount', () => {
    it('should save the context instance in the registry with provided id', async () => {
      renderTestContext({ contextId: 'my-context' });

      const watchdog = await ContextsRegistry.the.waitFor('my-context');

      expect(watchdog).toBeInstanceOf(ContextWatchdog);
      expect(watchdog.context).toBeInstanceOf(Context);
    });

    it('should initialize context with empty creator config', async () => {
      renderTestContext(createContextSnapshot(DEFAULT_TEST_CONTEXT_ID, {
        config: {},
      }));

      expect(await waitForTestContext()).toBeInstanceOf(ContextWatchdog);
    });

    it('should print console error if `itemError` event is fired', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderTestContext();

      const watchdog = await waitForTestContext();

      (watchdog as any)._fire('itemError', 'test-error', { some: 'data' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Context item error:', null, 'test-error', { some: 'data' });

      consoleErrorSpy.mockRestore();
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

      const { context } = await waitForTestContext();

      expect(context?.plugins.get('CustomPlugin')).toBeInstanceOf(CustomPlugin);
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

      const { context } = await waitForTestContext();
      const plugin = context?.plugins.get('CustomPlugin') as CustomPlugin;

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

      const { context } = await waitForTestContext();
      const plugin = context?.plugins.get('CustomPlugin') as CustomPlugin;

      expect(plugin.getHelloTitle()).toBe('Witaj z CustomPlugin');
    });
  });

  describe('attaching editor', () => {
    it('should not attach editor to the context (editor has no specified context, context initialized)', async () => {
      renderTestContext();

      const { context } = await waitForTestContext();

      renderTestEditor();

      await waitForTestEditor();

      expect(context?.editors.first).toBeNull();
    });

    it('should attach editor to the context (editor has specified context, context initialized)', async () => {
      renderTestContext();

      const { context } = await waitForTestContext();

      renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const editor = await waitForTestEditor();

      expect(context?.editors.first).toEqual(editor);
    });

    it('should pause editor initialization when context is not yet initialized', async () => {
      renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      await timeout(50);

      renderTestContext();

      const { context } = await waitForTestContext();
      const editor = await waitForTestEditor();

      expect(context?.editors.first).toEqual(editor);
    });

    it('should be possible to attach multiple editors to the same context', async () => {
      renderTestContext();

      const { context } = await waitForTestContext();

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

      expect(context?.editors.length).toBe(2);
      expect([...context!.editors]).toEqual(editors);
    });
  });

  describe('destroy', () => {
    it('destroyed editor is removed from the context editors collection', async () => {
      renderTestContext();

      const { context } = await waitForTestContext();

      const editorEl = renderTestEditor({
        contextId: DEFAULT_TEST_CONTEXT_ID,
      });

      const editor = await waitForTestEditor();

      expect(context?.editors.first).toEqual(editor);

      editorEl.remove();

      await expect.poll(() => context?.editors.first).toBeNull();
    });

    it('should remove the context instance from the registry on destroy', async () => {
      const el = renderTestContext({ contextId: 'my-context' });

      const watchdog = await ContextsRegistry.the.waitFor('my-context');

      expect(watchdog).toBeInstanceOf(ContextWatchdog);

      el.remove();

      await expect.poll(() => ContextsRegistry.the.hasItem('my-context')).toBe(false);
      expect(watchdog.state).toBe('destroyed');
    });

    it('should hide element during destruction', async () => {
      const el = renderTestContext();

      el.remove();

      expect(el.style.display).toBe('none');
    });

    it('should handle destruction when mounted promise is not resolved yet', async () => {
      const el = renderTestContext();

      el.remove();

      expect(el.style.display).toBe('none');
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
  });
});
