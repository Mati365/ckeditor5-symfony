import { registerCustomElements } from './elements';

export { CKEditor5SymfonyError } from './ckeditor5-symfony-error';
export { ContextsRegistry } from './elements/context/contexts-registry';
export { EditableComponentElement } from './elements/editable';
export { EditorComponentElement } from './elements/editor';
export { CustomEditorPluginsRegistry } from './elements/editor/custom-editor-plugins';
export { EditorsRegistry } from './elements/editor/editors-registry';
export { UIPartComponentElement } from './elements/ui-part';

registerCustomElements();
