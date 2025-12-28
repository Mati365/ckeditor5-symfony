<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Language\LanguageParser;

/**
 * CKEditor 5 Twig Widget.
 */
class CKEditorRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
        private ConfigManager $configManager
    ) {}

    /**
     * Render the CKEditor widget.
     *
     * @param string $content The initial content of the editor
     * @param string $preset The preset name to use (default: 'default')
     * @param bool $watchdog Whether to enable the watchdog feature
     * @param string|null $name Optional name for the input field.
     * @param int|null $editableHeight Optional height for the editable area
     * @param string|null $class Optional CSS class for the editor container
     * @param string|null $style Optional inline styles for the editor container
     * @param string|null $id Optional ID for the editor instance
     * @param bool|null $required Whether the input is required
     * @param string|null $contextId Optional context ID for multiple editors
     * @param string|array|null $language Optional language configuration (string or array)
     * @return string Rendered HTML
     */
    public function render(
        string $content = '',
        string $preset = 'default',
        bool $watchdog = true,
        ?string $name = null,
        ?bool $required = null,
        ?int $editableHeight = null,
        ?string $class = null,
        ?string $style = null,
        ?string $id = null,
        ?string $contextId = null,
        string|array|null $language = null,
    ): string {
        $id ??= 'cke5-' . uniqid();
        $resolvedPreset = $this->configManager->resolvePresetOrThrow($preset);
        $parsedLanguage = LanguageParser::parse($language);

        return $this->twig->render('@CKEditor5/cke5_editor.html.twig', [
            'id' => $id,
            'class' => $class,
            'style' => $style,
            'name' => $name,
            'required' => $required,
            'content' => $content,
            'editableHeight' => $editableHeight,
            'preset' => json_encode($resolvedPreset),
            'language' => json_encode($parsedLanguage),
            'watchdog' => $watchdog,
            'contextId' => $contextId,
        ]);
    }
}
