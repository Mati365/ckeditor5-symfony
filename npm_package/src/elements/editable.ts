import type { MultiRootEditor } from 'ckeditor5';

import { CKEditor5SymfonyError } from '../ckeditor5-symfony-error';
import { debounce, waitForDOMReady } from '../shared';
import { EditorsRegistry } from './editor/editors-registry';
import { queryAllEditorIds } from './editor/utils';

/**
 * Editable hook for Symfony. It allows you to create editables for multi-root editors.
 */
export class EditableComponentElement extends HTMLElement {
  /**
   * The promise that resolves when the editable is mounted.
   */
  private editorPromise: Promise<MultiRootEditor> | null = null;

  /**
   * Mounts the editable component.
   */
  async connectedCallback() {
    await waitForDOMReady();

    if (!this.hasAttribute('data-cke-editor-id')) {
      this.setAttribute('data-cke-editor-id', queryAllEditorIds()[0]!);
    }

    const editorId = this.getAttribute('data-cke-editor-id');
    const rootName = this.getAttribute('data-cke-root-name');
    const content = this.getAttribute('data-cke-content');
    const saveDebounceMs = Number.parseInt(this.getAttribute('data-cke-save-debounce-ms')!, 10);

    /* v8 ignore next 3 */
    if (!editorId || !rootName) {
      throw new CKEditor5SymfonyError('Editor ID or Root Name is missing.');
    }

    // If the editor is not registered yet, we will wait for it to be registered.
    this.style.display = 'block';
    this.editorPromise = EditorsRegistry.the.execute(editorId, async (editor: MultiRootEditor) => {
      const input = this.querySelector('input') as HTMLInputElement | null;
      const { ui, editing, model } = editor;

      if (model.document.getRoot(rootName)) {
        // If the newly added root already exists, but the newly added editable has content,
        // we need to update the root data with the editable content.
        if (content !== null) {
          const data = editor.getData({ rootName });

          if (data && data !== content) {
            editor.setData({
              [rootName]: content,
            });
          }
        }

        return editor;
      }

      editor.addRoot(rootName, {
        isUndoable: false,
        ...content !== null && {
          data: content,
        },
      });

      const contentElement = this.querySelector('[data-cke-editable-content]') as HTMLElement | null;
      const editable = ui.view.createEditable(rootName, contentElement!);

      ui.addEditable(editable);
      editing.view.forceRender();

      // Sync data with socket and input element.
      const sync = () => {
        const html = editor.getData({ rootName });

        if (input) {
          input.value = html;
          input.dispatchEvent(new Event('input'));
        }

        this.dispatchEvent(new CustomEvent('change', { detail: { value: html } }));
      };

      editor.model.document.on('change:data', debounce(saveDebounceMs, sync));
      sync();

      return editor;
    });
  }

  /**
   * Destroys the editable component. Unmounts root from the editor.
   */
  async disconnectedCallback() {
    const rootName = this.getAttribute('data-cke-root-name');

    // Let's hide the element during destruction to prevent flickering.
    this.style.display = 'none';

    // Let's wait for the mounted promise to resolve before proceeding with destruction.
    const editor = await this.editorPromise;
    this.editorPromise = null;

    // Unmount root from the editor if editor is still registered.
    if (editor && editor.state !== 'destroyed' && rootName) {
      const root = editor.model.document.getRoot(rootName);

      if (root && 'detachEditable' in editor) {
        editor.detachEditable(root);
        editor.detachRoot(rootName, false);
      }
    }
  }
}
