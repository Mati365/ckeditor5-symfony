import type { Context, ContextWatchdog } from 'ckeditor5';

import type { EditorLanguage } from '../editor';
import type { ContextConfig } from './typings';

import { CKEditor5SymfonyError } from '../../ckeditor5-symfony-error';
import { isEmptyObject, waitForDOMReady } from '../../shared';
import {
  loadAllEditorTranslations,
  loadEditorPlugins,
  normalizeCustomTranslations,
} from '../editor/utils';
import { ContextsRegistry } from './contexts-registry';

/**
 * The Symfony hook that mounts CKEditor context instances.
 */
export class ContextComponentElement extends HTMLElement {
  /**
   * The promise that resolves to the context instance.
   */
  private contextPromise: Promise<ContextWatchdog<Context>> | null = null;

  /**
   * Mounts the context component.
   */
  async connectedCallback() {
    await waitForDOMReady();

    const contextId = this.getAttribute('data-cke-context-id');
    const language = JSON.parse(this.getAttribute('data-cke-language')!) as EditorLanguage;
    const contextConfig = JSON.parse(this.getAttribute('data-cke-context') || '{}') as ContextConfig;

    if (!contextId) {
      throw new CKEditor5SymfonyError('Context ID is missing.');
    }

    const { customTranslations, watchdogConfig, config: { plugins, ...config } } = contextConfig;
    const { loadedPlugins, hasPremium } = await loadEditorPlugins(plugins ?? []);

    // Mix custom translations with loaded translations.
    const loadedTranslations = await loadAllEditorTranslations(language, hasPremium);
    const mixedTranslations = [
      ...loadedTranslations,
      normalizeCustomTranslations(customTranslations || {}),
    ]
      .filter(translations => !isEmptyObject(translations));

    // Initialize context with watchdog.
    this.contextPromise = (async () => {
      const { ContextWatchdog, Context } = await import('ckeditor5');

      const instance = new ContextWatchdog(Context, {
        crashNumberLimit: 10,
        ...watchdogConfig,
      });

      await instance.create({
        ...config,
        language,
        plugins: loadedPlugins,
        ...mixedTranslations.length && {
          translations: mixedTranslations,
        },
      });

      instance.on('itemError', (...args) => {
        console.error('Context item error:', ...args);
      });

      return instance;
    })();

    const context = await this.contextPromise;

    if (this.isConnected) {
      ContextsRegistry.the.register(contextId, context);
    }
  }

  /**
   * Destroys the context component. Unmounts root from the editor.
   */
  async disconnectedCallback() {
    const contextId = this.getAttribute('data-cke-context-id');

    // Let's hide the element during destruction to prevent flickering.
    this.style.display = 'none';

    // Let's wait for the mounted promise to resolve before proceeding with destruction.
    try {
      const context = await this.contextPromise;

      await context?.destroy();
    }
    finally {
      this.contextPromise = null;

      if (contextId && ContextsRegistry.the.hasItem(contextId)) {
        ContextsRegistry.the.unregister(contextId);
      }
    }
  }
}
