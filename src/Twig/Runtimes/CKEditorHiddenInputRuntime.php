<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;

/**
 * CKEditor 5 Hidden Input Twig Widget.
 */
class CKEditorHiddenInputRuntime implements RuntimeExtensionInterface
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

        return $this->twig->render('@CKEditor5/cke5_hidden_input.html.twig', [
            'id' => $id,
            'class' => $class,
            'style' => $style,
            'name' => $name,
            'required' => $required,
        ]);
    }
}
