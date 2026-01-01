<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Language\LanguageParser;
use Mati365\CKEditor5Symfony\Service\ConfigManager;

/**
 * CKEditor 5 Context Twig Widget.
 */
final class CKEditorContextRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
        private ConfigManager $configManager
    ) {}

    /**
     * Render the CKEditor context widget.
     *
     * @param string|null $language The language code for the context (default: 'en').
     * @param string|null $contextPreset The context preset name to use (default: 'default').
     * @param string|null $id Optional ID for the context instance.
     * @return string Rendered HTML
     */
    public function render(
        ?string $language = 'en',
        ?string $contextPreset = null,
        ?string $id = null
    ): string {
        $id ??= 'cke5-context-' . uniqid();
        $parsedLanguage = LanguageParser::parse($language);
        $resolvedContext = $this->configManager->resolveContextOrThrow($contextPreset ?? 'default');

        return $this->twig->render('@CKEditor5/cke5_context.html.twig', [
            'id' => $id,
            'context' => json_encode($resolvedContext),
            'language' => json_encode($parsedLanguage),
        ]);
    }
}
