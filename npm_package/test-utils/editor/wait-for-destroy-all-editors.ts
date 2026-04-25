import { vi } from 'vitest';

import { ContextsRegistry } from '../../src/elements/context/contexts-registry';
import { CustomEditorPluginsRegistry } from '../../src/elements/editor/custom-editor-plugins';
import { EditorsRegistry } from '../../src/elements/editor/editors-registry';

/**
 * Waits for all editors to be destroyed.
 */
export async function waitForDestroyAllEditors(): Promise<void> {
  await EditorsRegistry.the.reset();

  await vi.waitUntil(() => !EditorsRegistry.the.getItems().length);
  await vi.waitUntil(() => !ContextsRegistry.the.getItems().length);

  ContextsRegistry.the.reset();

  CustomEditorPluginsRegistry.the.unregisterAll();
}
