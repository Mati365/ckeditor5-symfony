import type { LanguageConfig } from 'ckeditor5';

import {
  BalloonEditor,
  ClassicEditor,
  DecoupledEditor,
  Editor,
  InlineEditor,
  MultiRootEditor,
  Plugin,
} from 'ckeditor5';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEditableSnapshot,
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
import { unwrapEditorWatchdog } from './utils';

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
        renderTestEditable(createEditableSnapshot('main', null));

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(isEditorShown()).toBe(true);
      });

      it('should pick initial content from the editable snapshot if provided', async () => {
        const initialEditableContent = '<p>Initial editable content</p>';

        renderTestEditor({ preset: createEditorPreset('decoupled') });
        renderTestEditable(createEditableSnapshot('main', initialEditableContent));

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(editor.getData()).toBe(initialEditableContent);
      });

      it('should wait for root element to be present in DOM if it is not', async () => {
        renderTestEditor({ preset: createEditorPreset('decoupled') });

        await timeout(200);

        renderTestEditable(createEditableSnapshot('main', null));

        const editor = await waitForTestEditor();

        expect(editor).to.toBeInstanceOf(DecoupledEditor);
        expect(isEditorShown()).toBe(true);
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

        renderTestEditable(createEditableSnapshot('header'));

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

        renderTestEditable(createEditableSnapshot('header', ''));

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

        renderTestEditable(
          createEditableSnapshot('header', '<p>Editable content overrides snapshot content</p>'),
        );

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

        editor.addRoot('existingRoot', { data: '<p>Old content</p>' });

        renderTestEditable(createEditableSnapshot('existingRoot', '<p>New content</p>'));

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
  });

  describe('`watchdog` snapshot parameter`', () => {
    it('should not wrap editor with watchdog if `watchdog` is false', async () => {
      renderTestEditor({
        watchdog: false,
      });

      const editor = await waitForTestEditor();
      const watchdog = unwrapEditorWatchdog(editor);

      expect(watchdog).toBeNull();
    });

    it('should resurrect editor after crashing and broadcast the new instance when `watchdog` is enabled', async () => {
      renderTestEditor({
        editorId: 'editor-with-watchdog',
        watchdog: true,
      });

      const originalEditor = await waitForTestEditor('editor-with-watchdog');
      const watchdog = unwrapEditorWatchdog(originalEditor)!;

      (watchdog as any)._restart();

      await vi.waitFor(async () => {
        const newEditor = await waitForTestEditor('editor-with-watchdog');

        expect(newEditor).not.equals(originalEditor);
      });
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

  describe('destroy', () => {
    it('should destroy editor on component unmount', async () => {
      const component = renderTestEditor();

      const editor = await waitForTestEditor();

      component.remove();

      await vi.waitFor(() => {
        expect(editor.state).toBe('destroyed');
      });
    });
  });
});
