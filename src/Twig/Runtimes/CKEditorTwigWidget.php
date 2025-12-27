<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Service\ConfigManager;

/**
 * CKEditor 5 Twig Widget.
 */
class CKEditorTwigWidget implements RuntimeExtensionInterface
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
     */
    public function render(
        string $content,
        string $preset = 'default',
    ): string {
        $preset = $this->configManager->resolvePresetOrThrow($preset);

        return $this->twig->render('@CKEditor5/widget.html.twig', [
            'content' => $content,
        ]);
    }
}
