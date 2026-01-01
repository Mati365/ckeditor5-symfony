<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;

/**
 * CKEditor 5 UI Part Twig Widget.
 */
final class CKEditorUIPartRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig
    ) {}

    /**
     * Render the CKEditor UI part widget.
     *
     * @param string $name The name of the UI part (e.g., "toolbar", "menubar").
     * @param string|null $editorId The ID of the editor instance this UI part belongs to.
     * @param string|null $class Optional CSS class for the UI part container.
     * @param string|null $style Optional inline styles for the UI part container.
     * @param string|null $id Optional ID for the UI part instance.
     * @return string Rendered HTML
     */
    public function render(
        string $name,
        ?string $editorId = null,
        ?string $class = null,
        ?string $style = null,
        ?string $id = null
    ): string {
        $id ??= 'cke5-ui-part-' . uniqid();

        return $this->twig->render('@CKEditor5/cke5_ui_part.html.twig', [
            'id' => $id,
            'editorId' => $editorId,
            'name' => $name,
            'class' => $class,
            'style' => $style,
        ]);
    }
}
