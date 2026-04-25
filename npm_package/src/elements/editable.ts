import type { DecoupledEditor, MultiRootEditor } from 'ckeditor5';

import { CKEditor5SymfonyError } from '../ckeditor5-symfony-error';
import { debounce, waitForDOMReady } from '../shared';
import { EditorsRegistry } from './editor/editors-registry';
import { isMultirootEditorInstance, queryAllEditorIds } from './editor/utils';

/**
 * Editable hook for Symfony. It allows you to create editables for multi-root editors.
 */
export class EditableComponentElement extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  private unmountEffect: VoidFunction | null = null;

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

    this.unmountEffect = EditorsRegistry.the.mountEffect(editorId, (editor: DecoupledEditor | MultiRootEditor) => {
      if (!this.isConnected) {
        return;
      }

      const input = this.querySelector('input') as HTMLInputElement | null;

      if (editor.model.document.getRoot(rootName)) {
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

        return;
      }

      if (isMultirootEditorInstance(editor)) {
        const { ui, editing } = editor;

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
      }

      // Sync data with socket and input element.
      const sync = () => {
        const html = editor.getData({ rootName });

        if (input) {
          input.value = html;
          input.dispatchEvent(new Event('input'));
        }

        this.dispatchEvent(new CustomEvent('change', { detail: { value: html } }));
      };

      const debouncedSync = debounce(saveDebounceMs, sync);

      editor.model.document.on('change:data', debouncedSync);
      sync();

      return () => {
        editor.model.document.off('change:data', debouncedSync);

        if (editor.state !== 'destroyed' && rootName) {
          const root = editor.model.document.getRoot(rootName);

          if (root && isMultirootEditorInstance(editor)) {
            // Detaching editables seem to be buggy when something removed DOM element of the editable (e.g. Blazor re-render) before
            // the editable is unmounted. To prevent errors in such cases, we will try to detach the editable if it exists, but ignore errors.
            try {
              if (editor.ui.view.editables[rootName]) {
                editor.detachEditable(root);
              }
              /* v8 ignore start -- @preserve */
            }
            catch (err) {
              // Ignore errors when detaching editable.
              console.error('Unable unmount editable from root:', err);
            }
            /* v8 ignore end */

            if (root.isAttached()) {
              editor.detachRoot(rootName, false);
            }
          }
        }
      };
    });
  }

  /**
   * Destroys the editable component. Unmounts root from the editor.
   */
  disconnectedCallback() {
    // Let's hide the element during destruction to prevent flickering.
    this.style.display = 'none';

    // Stop observing the registry and run cleanup immediately.
    this.unmountEffect?.();
    this.unmountEffect = null;
  }
}
