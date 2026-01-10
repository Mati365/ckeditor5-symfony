import { Editor } from 'ckeditor5';
import { AsyncRegistry } from '../../shared/async-registry';
/**
 * It provides a way to register editors and execute callbacks on them when they are available.
 */
export declare class EditorsRegistry extends AsyncRegistry<Editor> {
    static readonly the: EditorsRegistry;
}
//# sourceMappingURL=editors-registry.d.ts.map