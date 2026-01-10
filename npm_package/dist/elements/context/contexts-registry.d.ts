import { Context, ContextWatchdog } from 'ckeditor5';
import { AsyncRegistry } from '../../shared';
/**
 * It provides a way to register contexts and execute callbacks on them when they are available.
 */
export declare class ContextsRegistry extends AsyncRegistry<ContextWatchdog<Context>> {
    static readonly the: ContextsRegistry;
}
//# sourceMappingURL=contexts-registry.d.ts.map