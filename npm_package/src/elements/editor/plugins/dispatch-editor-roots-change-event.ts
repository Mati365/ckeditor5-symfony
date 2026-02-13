import type { PluginConstructor } from 'ckeditor5';

import { debounce } from '../../../shared';
import { getEditorRootsValues } from '../utils';

/**
 * Creates a DispatchEditorRootsChangeEvent plugin class.
 */
export async function createDispatchEditorRootsChangeEventPlugin(
  {
    saveDebounceMs,
    editorId,
    targetElement,
  }: CreateDispatchEditorRootsChangeEventPluginParams,
): Promise<PluginConstructor> {
  const { Plugin } = await import('ckeditor5');

  return class DispatchEditorRootsChangeEvent extends Plugin {
    /**
     * The name of the plugin.
     */
    static get pluginName() {
      return 'DispatchEditorRootsChangeEvent' as const;
    }

    /**
     * Initializes the plugin.
     */
    public afterInit(): void {
      const sync = debounce(saveDebounceMs, this.dispatch);

      this.editor.model.document.on('change:data', sync);
      this.editor.once('ready', this.dispatch);
    }

    /**
     * Dispatches a custom event with all roots data.
     */
    private dispatch = (): void => {
      targetElement.dispatchEvent(
        new CustomEvent('ckeditor5:change:data', {
          detail: {
            editorId,
            roots: getEditorRootsValues(this.editor),
          },
          bubbles: true,
        }),
      );
    };
  };
}

type CreateDispatchEditorRootsChangeEventPluginParams = {
  saveDebounceMs: number;
  editorId: string;
  targetElement: HTMLElement;
};
