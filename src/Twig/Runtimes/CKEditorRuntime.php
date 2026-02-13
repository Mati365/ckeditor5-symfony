<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Language\LanguageParser;
use Mati365\CKEditor5Symfony\Preset\{EditorType, Preset};

/**
 * CKEditor 5 Twig Widget.
 */
final class CKEditorRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
        private ConfigManager $configManager
    ) {}

    /**
     * Render the CKEditor widget.
     *
     * @param string|array|null $content The initial content of the editor
     * @param Preset|string|null $preset The preset name to use (default: 'default')
     * @param bool $watchdog Whether to enable the watchdog feature
     * @param string|null $name Optional name for the input field.
     * @param int|null $editableHeight Optional height for the editable area
     * @param string|null $class Optional CSS class for the editor container
     * @param string|null $style Optional inline styles for the editor container
     * @param string|null $id Optional ID for the editor instance
     * @param bool|null $required Whether the input is required
     * @param int|null $saveDebounceMs Optional debounce time in milliseconds for saving changes
     * @param string|null $contextId Optional context ID for multiple editors
     * @param string|array|null $language Optional language configuration (string or array)
     * @param array|null $config Optional editor configuration overrides (shallow replace editor config)
     * @param array|null $mergeConfig Optional editor configuration to merge (deep merge with editor config)
     * @param array|null $customTranslations Optional custom translations dictionary
     * @param string|null $editorType Optional editor type to use
     * @return string Rendered HTML
     */
    public function render(
        string|array|null $content = null,
        Preset|string|null $preset = null,
        ?bool $watchdog = true,
        ?string $name = null,
        ?bool $required = null,
        ?int $saveDebounceMs = 200,
        ?int $editableHeight = null,
        ?string $class = null,
        ?string $style = 'display: block; width: 100%;',
        ?string $id = null,
        ?string $contextId = null,
        string|array|null $language = null,
        ?array $config = null,
        ?array $mergeConfig = null,
        ?array $customTranslations = null,
        ?string $editorType = null,
    ): string {
        $id ??= 'cke5-' . uniqid();
        $resolvedPreset = $this->configManager->resolvePresetOrThrow($preset ?? 'default');
        $parsedLanguage = LanguageParser::parse($language);

        if ($config !== null) {
            $resolvedPreset = $resolvedPreset->ofConfig($config);
        }

        if ($mergeConfig !== null) {
            $resolvedPreset = $resolvedPreset->ofMergedConfig($mergeConfig);
        }

        if ($customTranslations !== null) {
            $resolvedPreset = $resolvedPreset->ofCustomTranslations($customTranslations);
        }

        if ($editorType !== null) {
            $resolvedPreset = $resolvedPreset->ofEditorType(
                EditorType::from($editorType)
            );
        }

        if (is_string($content)) {
            $content = ['main' => $content];
        }

        $style = 'position: relative;' . ($style !== null ? ' ' . $style : '');
        $showInput = !in_array($resolvedPreset->editorType, [
            EditorType::MULTIROOT,
            EditorType::DECOUPLED,
        ], true);

        return $this->twig->render('@CKEditor5/cke5_editor.html.twig', [
            'id' => $id,
            'class' => $class,
            'style' => $style,
            'name' => $name,
            'required' => $required,
            'content' => json_encode($content),
            'saveDebounceMs' => $saveDebounceMs,
            'editableHeight' => $editableHeight,
            'preset' => json_encode($resolvedPreset),
            'language' => json_encode($parsedLanguage),
            'watchdog' => $watchdog,
            'contextId' => $contextId,
            'show_input' => $showInput,
        ]);
    }
}
