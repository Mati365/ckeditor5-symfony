<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;

/**
 * CKEditor 5 Context Twig Widget.
 */
final class CKEditorContextRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig
    ) {}

    /**
     * Render the CKEditor context widget.
     *
     * @param string $contextId The unique identifier for the context instance.
     * @param array $context The context configuration.
     * @param string $language The language of the context UI and content.
     * @param string|null $id Optional ID for the context instance.
     * @return string Rendered HTML
     */
    public function render(
        string $contextId,
        array $context,
        string $language = 'en',
        ?string $id = null
    ): string {
        $id ??= 'cke5-context-' . uniqid();

        return $this->twig->render('cke5_context.html.twig', [
            'id' => $id,
            'contextId' => $contextId,
            'context' => $context,
            'language' => $language,
        ]);
    }
}
