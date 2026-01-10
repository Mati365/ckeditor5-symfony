import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEditorPreset,
  createUIPartSnapshot,
  renderTestEditor,
  renderTestUIPart,
  waitForDestroyAllEditors,
  waitForTestEditor,
} from '~/test-utils';

import { timeout } from '../shared';
import { EditorsRegistry } from './editor/editors-registry';
import { registerCustomElements } from './register-custom-elements';

describe('ui-part component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    registerCustomElements();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.resetAllMocks();

    await waitForDestroyAllEditors();
    document.body.innerHTML = '';
  });

  describe('mounting ui part', () => {
    it('should mount toolbar to the editor after mounting editor', async () => {
      appendMultirootEditor();

      const editor = await waitForTestEditor();
      const toolbarElement = editor.ui.view.toolbar?.element;

      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));

      await vi.waitFor(() => {
        expect(el.contains(toolbarElement!)).toBe(true);
      });

      expect(toolbarElement).toBeTruthy();
    });

    it('should mount menubar to the editor after mounting editor', async () => {
      appendMultirootEditor();

      const editor = await waitForTestEditor();
      const menubarElement = (editor.ui.view as any).menuBarView.element;

      const el = renderTestUIPart(createUIPartSnapshot('menubar'));

      await vi.waitFor(() => {
        expect(el.children.length).toBeGreaterThan(0);
      });

      expect(el.contains(menubarElement)).toBe(true);
    });

    it('should mount UI part before editor is created', async () => {
      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));

      appendMultirootEditor();

      const editor = await waitForTestEditor();
      const toolbarElement = editor.ui.view.toolbar?.element;

      await vi.waitFor(() => {
        expect(el.contains(toolbarElement!)).toBe(true);
      });

      expect(toolbarElement).toBeTruthy();
    });

    it('should default to first editor ID if data-cke-editor-id is missing', async () => {
      appendMultirootEditor();

      const editor = await waitForTestEditor();
      const toolbarElement = editor.ui.view.toolbar?.element;

      // Render UI part without editorId
      const el = renderTestUIPart({ editorId: undefined } as any);

      await vi.waitFor(() => {
        expect(el.contains(toolbarElement!)).toBe(true);
      });

      expect(toolbarElement).toBeTruthy();
    });

    it('should not mount UI part if element is disconnected before editor is ready', async () => {
      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));
      el.remove();

      appendMultirootEditor();

      await waitForTestEditor();
      await timeout(10);

      expect(el.innerHTML).toBe('');
    });
  });

  describe('destroying ui part', () => {
    beforeEach(async () => {
      appendMultirootEditor();
      await waitForTestEditor();
    });

    it('should clear UI part element on destruction', async () => {
      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));

      await vi.waitFor(() => {
        expect(el.children.length).toBeGreaterThan(0);
      });

      el.remove();

      await vi.waitFor(() => {
        expect(el.innerHTML).toBe('');
      });

      expect(el.style.display).toBe('none');
    });

    it('should hide element during destruction', async () => {
      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));

      // If we remove immediately, disconnectedCallback should hide it.
      el.remove();

      // Ensure style is updated synchronously or microtask
      expect(el.style.display).toBe('none');
    });

    it('should handle destruction when mounted promise is not resolved yet', async () => {
      document.body.innerHTML = '';
      EditorsRegistry.the.reset();

      const el = renderTestUIPart(createUIPartSnapshot('toolbar'));

      el.remove();

      expect(el.innerHTML).toBe('');
      expect(el.style.display).toBe('none');
    });
  });

  function appendMultirootEditor(initialContent: Record<string, string> = {}) {
    renderTestEditor({
      preset: createEditorPreset('multiroot'),
      content: initialContent,
    });
  }
});
