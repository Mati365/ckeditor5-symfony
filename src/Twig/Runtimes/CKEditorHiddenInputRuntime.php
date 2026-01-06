<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;

/**
 * CKEditor 5 Hidden Input Twig Widget.
 */
final class CKEditorHiddenInputRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
    ) {}

    /**
     * Render the CKEditor hidden input widget.
     *
     * @param string|null $name Optional name for the input field.
     * @param bool|null $required Whether the input is required
     * @param string|null $style Optional inline styles for the editor container
     * @param string|null $class Optional CSS class for the editor container
     * @param string|null $id Optional ID for the editor instance
     * @return string Rendered HTML
     */
    public function render(
        ?string $name = null,
        ?bool $required = null,
        ?string $class = null,
        ?string $style = null,
        ?string $id = null
    ): string {
        $id ??= 'cke5-input-' . uniqid();
        $style ??= self::getDefaultStyles();

        return $this->twig->render('@CKEditor5/cke5_hidden_input.html.twig', [
            'id' => $id,
            'class' => $class,
            'style' => $style,
            'name' => $name,
            'required' => $required,
        ]);
    }

    /**
     * Get the inline styles for the hidden input.
     *
     * @return string
     */
    private static function getDefaultStyles(): string
    {
        $styles = [
            'position: absolute',
            'left: 50%',
            'bottom: 0',
            'display: flex',
            'width: 1px',
            'height: 1px',
            'opacity: 0',
            'pointer-events: none',
            'margin: 0',
            'padding: 0',
            'border: none',
        ];

        return implode('; ', $styles) . ';';
    }
}
