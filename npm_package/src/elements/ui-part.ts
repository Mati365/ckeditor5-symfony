import { CKEditor5SymfonyError } from '../ckeditor5-symfony-error';
import { waitForDOMReady } from '../shared';
import { EditorsRegistry } from './editor/editors-registry';
import { queryAllEditorIds } from './editor/utils';

/**
 * UI Part hook for Symfony. It allows you to create UI parts for multi-root editors.
 */
export class UIPartComponentElement extends HTMLElement {
  /**
   * Stops observing the editor registry and immediately runs any pending cleanup.
   */
  private unmountEffect: VoidFunction | null = null;

  /**
   * Mounts the UI part component.
   */
  async connectedCallback() {
    await waitForDOMReady();

    const editorId = this.getAttribute('data-cke-editor-id') || queryAllEditorIds()[0]!;
    const name = this.getAttribute('data-cke-name');

    /* v8 ignore next 3 */
    if (!editorId || !name) {
      return;
    }

    // If the editor is not registered yet, we will wait for it to be registered.
    this.style.display = 'block';

    this.unmountEffect = EditorsRegistry.the.mountEffect(editorId, (editor) => {
      if (!this.isConnected) {
        return;
      }

      const { ui } = editor;

      const uiViewName = mapUIPartView(name);
      const uiPart = (ui.view as any)[uiViewName!];

      /* v8 ignore next 3 */
      if (!uiPart) {
        throw new CKEditor5SymfonyError(`Unknown UI part name: "${name}". Supported names are "toolbar" and "menubar".`);
      }

      this.appendChild(uiPart.element);

      return () => {
        this.innerHTML = '';
      };
    });
  }

  /**
   * Destroys the UI part component. Unmounts UI parts from the editor.
   */
  disconnectedCallback() {
    // Let's hide the element during destruction to prevent flickering.
    this.style.display = 'none';

    // Stop observing the registry and run cleanup immediately.
    this.unmountEffect?.();
    this.unmountEffect = null;
  }
}

/**
 * Maps the UI part name to the corresponding view in the editor.
 *
 * @param name The name of the UI part.
 * @returns The name of the view in the editor.
 */
function mapUIPartView(name: string): string | null {
  switch (name) {
    case 'toolbar':
      return 'toolbar';

    case 'menubar':
      return 'menuBarView';

    /* v8 ignore next 3 */
    default:
      return null;
  }
}
