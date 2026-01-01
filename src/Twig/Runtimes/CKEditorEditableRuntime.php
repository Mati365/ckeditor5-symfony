<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;

/**
 * CKEditor 5 Editable Twig Widget.
 */
final class CKEditorEditableRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig
    ) {}

    /**
     * Render the CKEditor editable widget.
     *
     * @param string $rootName The name of the root element in the editor.
     * @param string|null $editorId The ID of the editor instance this editable belongs to.
     * @param string|null $content The initial content value for the editable.
     * @param int|null $saveDebounceMs The debounce time in milliseconds for saving changes.
     * @param string|null $name Optional name for the input field.
     * @param bool|null $required Whether the input is required.
     * @param string|null $class Optional CSS class for the editable container.
     * @param string|null $style Optional inline styles for the editable container.
     * @param string|null $id Optional ID for the editable instance.
     * @param string|null $innerClass Optional CSS class for the inner content container.
     * @param string|null $innerStyle Optional inline styles for the inner content container.
     * @return string Rendered HTML
     */
    public function render(
        string $rootName = 'main',
        ?int $saveDebounceMs = 500,
        ?string $editorId = null,
        ?string $content = null,
        ?string $name = null,
        ?bool $required = null,
        ?string $class = null,
        ?string $style = null,
        ?string $id = null,
        ?string $innerClass = null,
        ?string $innerStyle = null,
    ): string {
        $id ??= 'cke5-editable-' . uniqid();

        return $this->twig->render('@CKEditor5/cke5_editable.html.twig', [
            'id' => $id,
            'editorId' => $editorId,
            'rootName' => $rootName,
            'content' => $content,
            'saveDebounceMs' => $saveDebounceMs,
            'name' => $name,
            'required' => $required,
            'class' => $class,
            'style' => $style,
            'innerClass' => $innerClass,
            'innerStyle' => $innerStyle,
        ]);
    }
}
