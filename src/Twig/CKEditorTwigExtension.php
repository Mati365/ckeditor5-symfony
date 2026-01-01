<?php

namespace Mati365\CKEditor5Symfony\Twig;

use Twig\TwigFunction;
use Twig\Extension\AbstractExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes;

/**
 * CKEditor 5 Twig Extension.
 */
final class CKEditorTwigExtension extends AbstractExtension
{
    /**
     * Returns a list of functions to add to the existing list.
     */
    #[\Override]
    public function getFunctions(): array
    {
        return [
            new TwigFunction(
                'cke5_editor',
                [Runtimes\CKEditorRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_cloud_assets',
                [Runtimes\CKEditorCloudAssetsRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_hidden_input',
                [Runtimes\CKEditorHiddenInputRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_context',
                [Runtimes\CKEditorContextRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_editable',
                [Runtimes\CKEditorEditableRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_ui_part',
                [Runtimes\CKEditorUIPartRuntime::class, 'render'],
                ['is_safe' => ['html']]
            ),
        ];
    }
}
