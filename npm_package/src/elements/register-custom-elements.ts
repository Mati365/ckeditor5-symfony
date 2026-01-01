import { ContextComponentElement } from './context';
import { EditableComponentElement } from './editable';
import { EditorComponentElement } from './editor';
import { UIPartComponentElement } from './ui-part';

const CUSTOM_ELEMENTS = {
  'cke5-editor': EditorComponentElement,
  'cke5-context': ContextComponentElement,
  'cke5-ui-part': UIPartComponentElement,
  'cke5-editable': EditableComponentElement,
};

/**
 * Registers all available Symfony component hooks.
 */
export function registerCustomElements() {
  for (const [name, CustomElement] of Object.entries(CUSTOM_ELEMENTS)) {
    window.customElements.define(name, CustomElement);
  }
}
