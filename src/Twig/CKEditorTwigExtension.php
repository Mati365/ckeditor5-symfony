<?php

namespace Mati365\CKEditor5Symfony\Twig;

use Twig\TwigFunction;
use Twig\Extension\AbstractExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes\{CKEditorTwigWidget, CKEditorAssetsTwigWidget};

/**
 * CKEditor 5 Twig Extension.
 */
class CKEditorTwigExtension extends AbstractExtension
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
                [CKEditorTwigWidget::class, 'render'],
                ['is_safe' => ['html']]
            ),

            new TwigFunction(
                'cke5_assets',
                [CKEditorAssetsTwigWidget::class, 'render'],
                ['is_safe' => ['html']]
            ),
        ];
    }
}
