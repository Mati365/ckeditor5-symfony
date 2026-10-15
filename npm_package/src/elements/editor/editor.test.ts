import type { LanguageConfig } from 'ckeditor5';

import {
  BalloonEditor,
  CKEditorError,
  ClassicEditor,
  DecoupledEditor,
  Editor,
  InlineEditor,
  MultiRootEditor,
  Plugin,
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEditorPreset,
  getTestEditorInput,
  html,
  isEditorShown,
  renderTestEditable,
  renderTestEditor,
  waitForDestroyAllEditors,
  waitForTestEditor,
} from '~/test-utils';

import { timeout } from '../../shared/timeout';
import { registerCustomElements } from '../register-custom-elements';
import { CustomEditorPluginsRegistry } from './custom-editor-plugins';
import { EditorsRegistry } from './editors-registry';

describe('editor component', () => {
  beforeEach(async () => {
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

  it('should save the editor instance in the registry with provided editorId', async () => {
    renderTestEditor();

    const editor = await waitForTestEditor();

    expect(editor).toBeInstanceOf(Editor);
  });

  it('should be possible to pass custom plugins to the editor', async () => {
    class MyCustomPlugin extends Plugin {
      static pluginName = 'MyCustomPlugin';
    }

    const preset = createEditorPreset('classic', {
      toolbar: [],
      plugins: ['MyCustomPlugin'],
    });

    CustomEditorPluginsRegistry.the.register('MyCustomPlugin', () => MyCustomPlugin);
    renderTestEditor({ preset });

    const editor = await waitForTestEditor();

    expect(editor.plugins.get('MyCustomPlugin')).toBeInstanceOf(MyCustomPlugin);
  });

  describe('editor types', () => {
    describe('classic', () => {
      it('should create an classic editor with default preset', async () => {
        renderTestEditor();

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(ClassicEditor);
        expect(isEditorShown()).toBe(true);
      });

      it('should assign default value from `content` snapshot property', async () => {
        const initialValue = `<p>Hello World! Today is ${new Date().toLocaleDateString()}</p>`;

        renderTestEditor({
          content: {
            main: initialValue,
          },
        });

        const editor = await waitForTestEditor();

        expect(editor.getData()).toBe(initialValue);
      });

      it('should assign empty main value if initialized editor with empty `content` snapshot property', async () => {
        renderTestEditor({
          content: {},
        });

        const editor = await waitForTestEditor();

        expect(editor.getData()).toBe('');
      });

      it('should be possible to specify root element name', async () => {
        renderTestEditor({
          modelElement: '$inlineRoot',
        });

        const editor = await waitForTestEditor();

        expect(editor.model.document.getRoot()?.name).toBe('$inlineRoot');
      });
    });

    describe('inline', () => {
      it('should create an inline editor with default preset', async () => {
        renderTestEditor({ preset: createEditorPreset('inline') });

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(InlineEditor);
        expect(isEditorShown()).toBe(true);
      });
    });

    describe('decoupled', () => {
      it('should create a decoupled editor with `main` editable and default preset', async () => {
        renderTestEditor({ preset: createEditorPreset('decoupled') });
        renderTestEditable({ rootName: 'main' });

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(isEditorShown()).toBe(true);
      });

      it('should pick initial content from the editable snapshot if provided', async () => {
        const initialEditableContent = '<p>Initial editable content</p>';

        renderTestEditor({ preset: createEditorPreset('decoupled') });
        renderTestEditable({
          rootName: 'main',
          content: initialEditableContent,
        });

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(editor.getData()).toBe(initialEditableContent);
      });

      it('should wait for root element to be present in DOM if it is not', async () => {
        renderTestEditor({ preset: createEditorPreset('decoupled') });

        await timeout(200);

        renderTestEditable({
          rootName: 'main',
          content: null,
        });

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(isEditorShown()).toBe(true);
      });

      it('should be possible to specify root element name using editable config alone', async () => {
        renderTestEditor({
          preset: createEditorPreset('decoupled'),
          content: {},
        });

        renderTestEditable({
          rootName: 'main',
          modelElement: '$inlineRoot',
        });

        const editor = await waitForTestEditor<DecoupledEditor>();

        await vi.waitFor(() => {
          expect(editor.model.document.getRoot()?.name).toEqual('$inlineRoot');
        });
      });

      it('should use editable root element name config if both specified', async () => {
        renderTestEditor({
          preset: createEditorPreset('decoupled'),
          content: {},
          modelElement: '$miamia',
        });

        renderTestEditable({
          rootName: 'main',
          modelElement: '$inlineRoot',
        });

        const editor = await waitForTestEditor<DecoupledEditor>();

        await vi.waitFor(() => {
          expect(editor.model.document.getRoot()?.name).toEqual('$inlineRoot');
        });
      });

      it('should use `main` root element name if editable root name is not specified', async () => {
        renderTestEditor({
          preset: createEditorPreset('decoupled'),
          content: {},
          modelElement: '$inlineRoot',
        });

        renderTestEditable({
          rootName: 'main',
        });

        const editor = await waitForTestEditor<DecoupledEditor>();

        await vi.waitFor(() => {
          expect(editor.model.document.getRoot()?.name).toEqual('$inlineRoot');
        });
      });
    });

    describe('balloon', () => {
      it('should create a balloon editor with default preset', async () => {
        renderTestEditor({ preset: createEditorPreset('balloon') });

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(BalloonEditor);
        expect(isEditorShown()).toBe(true);
      });
    });

    describe('multiroot', () => {
      it('should create a multiroot editor without editables in the DOM and initial content', async () => {
        renderTestEditor({
          preset: createEditorPreset('multiroot'),
          content: {},
        });

        const editor = await waitForTestEditor();

        expect(editor).toBeInstanceOf(MultiRootEditor);
      });

      it('should wait and for root elements to be present in DOM if they are not (with content=null value)', async () => {
        renderTestEditor({
          preset: createEditorPreset('multiroot'),
          content: {
            header: '<p>Header root initial content</p>',
          },
        });

        await timeout(500); // Simulate some delay before adding the root.

        renderTestEditable({ rootName: 'header' });

        const editor = await waitForTestEditor();

        expect(editor).toBeInstanceOf(MultiRootEditor);
        expect(editor.getData({ rootName: 'header' })).toBe('<p>Header root initial content</p>');
      });

      it('should wait and for root elements to be present in DOM if they are not (with content=\'\' value)', async () => {
        renderTestEditor({
          preset: createEditorPreset('multiroot'),
          content: {
            header: '<p>Header root initial content</p>',
          },
        });

        await timeout(500); // Simulate some delay before adding the root.

        renderTestEditable({
          rootName: 'header',
          content: '',
        });

        const editor = await waitForTestEditor();

        expect(editor).toBeInstanceOf(MultiRootEditor);
        expect(editor.getData({ rootName: 'header' })).toBe('');
      });

      it('should wait and for root elements to be present in DOM if they are not (with set content value)', async () => {
        renderTestEditor({
          preset: createEditorPreset('multiroot'),
          content: {
            header: '<p>Header root initial content</p>',
          },
        });

        renderTestEditable({
          rootName: 'header',
          content: '<p>Editable content overrides snapshot content</p>',
        });

        const editor = await waitForTestEditor();

        expect(editor).toBeInstanceOf(MultiRootEditor);

        await vi.waitFor(() => {
          expect(editor.getData({ rootName: 'header' })).toBe('<p>Editable content overrides snapshot content</p>');
        });
      });

      it('should not crash after setting content using `setData`', async () => {
        renderTestEditor({
          content: {
            main: '<p>Initial content</p>',
          },
        });

        const editor = await waitForTestEditor();

        expect(() => {
          editor.setData('<p>New content</p>');
        }).not.toThrow();
      });

      it('should update root data if root already exists but editable has different content', async () => {
        renderTestEditor({
          preset: createEditorPreset('multiroot'),
          content: {},
        });

        const editor = await waitForTestEditor<MultiRootEditor>();

        editor.addRoot('existingRoot', { initialData: '<p>Old content</p>' });

        renderTestEditable({
          rootName: 'existingRoot',
          content: '<p>New content</p>',
        });

        await vi.waitFor(() => {
          expect(editor.getData({ rootName: 'existingRoot' })).toBe('<p>New content</p>');
        });
      });
    });
  });

  describe('`editableHeight` snapshot parameter`', () => {
    it('should not set any height if `editableHeight` parameter is `null`', async () => {
      renderTestEditor({ editableHeight: null });

      const editor = await waitForTestEditor();

      const editableElement = editor.ui.getEditableElement()!;

      expect(getComputedStyle(editableElement).height).toBe('');
    });

    it('should set the editable height if `editableHeight` snapshot parameter is provided', async () => {
      renderTestEditor({ editableHeight: 400 });

      const editor = await waitForTestEditor();

      const editableElement = editor.ui.getEditableElement()!;

      expect(getComputedStyle(editableElement).height).toBe('400px');
    });
  });

  describe('`saveDebounceMs` snapshot parameter`', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should use parameter to debounce input sync', async () => {
      renderTestEditor({ saveDebounceMs: 400 }, { withInput: true });

      const editor = await waitForTestEditor();
      const input = getTestEditorInput();

      editor.setData('<p>Debounce test</p>');
      expect(input.value).to.be.equal('<p>Initial content</p>');

      await vi.advanceTimersByTimeAsync(399);
      expect(input.value).to.be.equal('<p>Initial content</p>');

      await vi.advanceTimersByTimeAsync(1);
      expect(input.value).to.be.equal('<p>Debounce test</p>');
    });
  });

  describe('`language` snapshot parameter`', () => {
    it('should be possible to pass language configuration to the editor configuration', async () => {
      renderTestEditor({
        language: {
          ui: 'pl',
          content: 'de',
        },
      });

      const editor = await waitForTestEditor();
      const configLanguage = editor.config.get('language') as LanguageConfig;

      expect(configLanguage.ui).toBe('pl');
      expect(configLanguage.content).toBe('de');
    });

    it('should have buttons translated to the selected UI language', async () => {
      renderTestEditor({
        language: {
          ui: 'pl',
          content: 'pl',
        },
      });

      const editor = await waitForTestEditor();

      expect(editor.t('Bold')).toBe('Pogrubienie');
    });

    it('should be possible to pass custom translations to the editor', async () => {
      const preset = createEditorPreset('classic', {}, {
        pl: {
          Bold: 'Czcionka grubaśna',
        },
      });

      renderTestEditor({
        preset,
        language: {
          ui: 'pl',
          content: 'pl',
        },
      });

      const editor = await waitForTestEditor();

      expect(editor.t('Bold')).toBe('Czcionka grubaśna');
    });

    it('should resolve $translation references in the editor configuration', async () => {
      const preset = createEditorPreset(
        'classic',
        {
          customPlugin: {
            label: { $translation: 'Custom' },
          },
        },
        {
          pl: {
            Custom: 'Mocarna czcionka',
          },
        },
      );

      renderTestEditor({
        preset,
        language: {
          ui: 'pl',
          content: 'pl',
        },
      });

      const editor = await waitForTestEditor();

      expect((editor.config.get('customPlugin') as any).label).toBe('Mocarna czcionka');
    });
  });

  describe('initialization errors', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Errors are not cleared by destroying editors. Clearing them also clears the default (`null`) error,
      // so they do not leak into tests that wait for the default editor.
      EditorsRegistry.the.resetErrors('failing-init-editor');
    });

    it('should log and register the error if the editor cannot be created', async () => {
      class FailingPlugin extends Plugin {
        static pluginName = 'FailingPlugin';

        init() {
          throw new Error('Plugin initialization failed');
        }
      }

      CustomEditorPluginsRegistry.the.register('FailingPlugin', () => FailingPlugin);

      renderTestEditor({
        editorId: 'failing-init-editor',
        preset: createEditorPreset('classic', {
          toolbar: [],
          plugins: ['FailingPlugin'],
        }),
      });

      await expect(EditorsRegistry.the.waitFor('failing-init-editor')).rejects.toThrow('Plugin initialization failed');

      expect(console.error).toHaveBeenCalledWith(
        'Error initializing CKEditor5 instance with ID "failing-init-editor":',
        expect.any(Error),
      );
    });
  });

  describe('errors of the running editor', () => {
    /**
     * Reports an error attributed to the given editor the same way the browser does for an uncaught error.
     */
    const reportEditorError = (editor: Editor) => {
      const error = new CKEditorError('test-editor-error', editor);

      window.dispatchEvent(new ErrorEvent('error', { error }));

      return error;
    };

    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log the error and switch the editor to read-only mode', async () => {
      renderTestEditor({ editorId: 'failing-editor' });

      const editor = await waitForTestEditor('failing-editor');

      expect(editor.isReadOnly).toBe(false);

      const error = reportEditorError(editor);

      expect(console.error).toHaveBeenCalledWith('CKEditor5 instance with ID "failing-editor" failed.', error);
      expect(editor.isReadOnly).toBe(true);
    });

    it('should ignore errors attributed to other editors', async () => {
      renderTestEditor({ editorId: 'healthy-editor' });
      renderTestEditor({ editorId: 'other-failing-editor' });

      const healthyEditor = await waitForTestEditor('healthy-editor');
      const failingEditor = await waitForTestEditor('other-failing-editor');

      reportEditorError(failingEditor);

      expect(console.error).toHaveBeenCalledWith('CKEditor5 instance with ID "other-failing-editor" failed.', expect.anything());
      expect(console.error).not.toHaveBeenCalledWith('CKEditor5 instance with ID "healthy-editor" failed.', expect.anything());
      expect(healthyEditor.isReadOnly).toBe(false);
      expect(failingEditor.isReadOnly).toBe(true);
    });
  });

  describe('form integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should sync editor data to the associated input field', async () => {
      renderTestEditor({ saveDebounceMs: 0 }, { withInput: true });

      const editor = await waitForTestEditor();
      const input = getTestEditorInput();

      editor.setData('<p>Form integration test</p>');
      await vi.advanceTimersByTimeAsync(1);

      expect(input.value).to.be.equal('<p>Form integration test</p>');
    });

    it('should not crash if hidden input is not present', async () => {
      renderTestEditor({ saveDebounceMs: 0 }, { withInput: false });

      const editor = await waitForTestEditor();

      expect(() => {
        editor.setData('<p>Form integration test</p>');
        vi.advanceTimersByTime(1);
      }).not.to.throw();
    });

    it('should immediately sync editor data to the associated input field on form submit', async () => {
      const form = html.form({ id: 'form' });
      document.body.appendChild(form);

      renderTestEditor({ saveDebounceMs: 5000 }, { withInput: true, container: form });

      const editor = await waitForTestEditor();
      const input = getTestEditorInput();

      editor.setData('<p>Form integration test</p>');
      await vi.advanceTimersByTimeAsync(1000);

      // Value should not be synced yet due to debounce.
      expect(input.value).to.be.equal('<p>Initial content</p>');

      // Submit the form.
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      await vi.advanceTimersByTimeAsync(1);

      // Value should be synced immediately on form submit.
      expect(input.value).to.be.equal('<p>Form integration test</p>');
    });
  });

  describe('roots change event integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should dispatch `ckeditor5:change:data` event with all roots values for single-root editor', async () => {
      const component = renderTestEditor({ saveDebounceMs: 0 });
      const changeSpy = vi.fn();
      const bodyChangeSpy = vi.fn();

      component.addEventListener('ckeditor5:change:data', changeSpy);
      document.body.addEventListener('ckeditor5:change:data', bodyChangeSpy);

      const editor = await waitForTestEditor();

      editor.setData('<p>Updated main root content</p>');
      await vi.advanceTimersByTimeAsync(1);

      expect(changeSpy).toHaveBeenCalled();
      expect((changeSpy.mock.lastCall![0] as CustomEvent).detail).toEqual({
        editorId: 'test-editor',
        editor,
        roots: {
          main: '<p>Updated main root content</p>',
        },
      });

      expect(bodyChangeSpy).toHaveBeenCalled();
      expect((bodyChangeSpy.mock.lastCall![0] as CustomEvent).detail).toEqual({
        editorId: 'test-editor',
        editor,
        roots: {
          main: '<p>Updated main root content</p>',
        },
      });
    });

    it('should dispatch `ckeditor5:change:data` event with all roots values for multiroot editor', async () => {
      const component = renderTestEditor({
        saveDebounceMs: 0,
        preset: createEditorPreset('multiroot'),
        content: {
          header: '<p>Header root initial content</p>',
          footer: '<p>Footer root initial content</p>',
        },
      });
      const changeSpy = vi.fn();

      component.addEventListener('ckeditor5:change:data', changeSpy);

      renderTestEditable({ rootName: 'header' });
      renderTestEditable({ rootName: 'footer' });

      const editor = await waitForTestEditor<MultiRootEditor>();

      editor.setData({
        header: '<p>Updated header content</p>',
        footer: '<p>Updated footer content</p>',
      });
      await vi.advanceTimersByTimeAsync(1);

      expect(changeSpy).toHaveBeenCalled();
      expect((changeSpy.mock.lastCall![0] as CustomEvent).detail).toEqual({
        editorId: 'test-editor',
        editor,
        roots: {
          header: '<p>Updated header content</p>',
          footer: '<p>Updated footer content</p>',
        },
      });
    });
  });

  describe('destroy', () => {
    it('should destroy editor on component unmount', async () => {
      const component = renderTestEditor();

      const editor = await waitForTestEditor();

      component.remove();

      await vi.waitFor(() => {
        expect(editor.state).toBe('destroyed');
      });
    });

    it('should not create the editor if component is removed before the DOM is ready', async () => {
      const createSpy = vi.spyOn(ClassicEditor, 'create');
      const component = renderTestEditor();

      component.remove();

      await timeout(50);

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('should destroy the editor and skip registration if component is removed during creation', async () => {
      const registerSpy = vi.spyOn(EditorsRegistry.the, 'register');

      let releaseInit!: () => void;
      const initGate = new Promise<void>((resolve) => {
        releaseInit = resolve;
      });

      let createdEditor: Editor | null = null;

      // Keeps the editor in the `initializing` state until the component is removed.
      class SlowPlugin extends Plugin {
        static pluginName = 'SlowPlugin';

        async init() {
          createdEditor = this.editor;
          await initGate;
        }
      }

      CustomEditorPluginsRegistry.the.register('SlowPlugin', () => SlowPlugin);

      const component = renderTestEditor({
        editorId: 'short-lived-editor',
        preset: createEditorPreset('classic', {
          toolbar: [],
          plugins: ['SlowPlugin'],
        }),
      });

      await vi.waitFor(() => {
        expect(createdEditor).not.toBeNull();
      });

      component.remove();
      releaseInit();

      await vi.waitFor(() => {
        expect(createdEditor!.state).toBe('destroyed');
      });

      expect(registerSpy).not.toHaveBeenCalled();
      expect(EditorsRegistry.the.hasItem('short-lived-editor')).toBe(false);
    });

    it('should not destroy the editor twice if it was destroyed manually before unmount', async () => {
      // Spied before creation, so the spy is what the idempotent `destroy()` wraps.
      const destroySpy = vi.spyOn(ClassicEditor.prototype, 'destroy');
      const component = renderTestEditor({ editorId: 'manually-destroyed-editor' });

      const editor = await waitForTestEditor('manually-destroyed-editor');

      await editor.destroy();

      // Unregistered by the `destroy` listener, not by the component.
      expect(EditorsRegistry.the.hasItem('manually-destroyed-editor')).toBe(false);

      component.remove();
      await timeout(0);

      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    it('should log and swallow errors thrown while destroying the editor', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const component = renderTestEditor({ editorId: 'failing-destroy-editor' });

      const editor = await waitForTestEditor('failing-destroy-editor');
      const error = new Error('Destroy failed');
      const destroySpy = vi.spyOn(editor, 'destroy').mockRejectedValueOnce(error);

      // `disconnectedCallback()` is not awaited, so a rejection here would be unhandled (and fail the run).
      component.remove();

      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to destroy CKEditor5 instance with ID "failing-destroy-editor".', error);
      });

      // The editor is not registered anymore, so the cleanup won't destroy it.
      destroySpy.mockRestore();
      await editor.destroy();
    });
  });
});
