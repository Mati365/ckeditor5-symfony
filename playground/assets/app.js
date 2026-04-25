import './bootstrap.js';
import './styles/app.css';

import { EditorsRegistry } from '@mati365/ckeditor5-symfony';

export function triggerCKE5Error(editorId = null) {
  setTimeout(() => {
    const err = new Error('foo');

    err.context = EditorsRegistry.the.getItem(editorId);
    err.is = () => true;

    throw err;
  });
}

window.triggerCKE5Error = triggerCKE5Error;
