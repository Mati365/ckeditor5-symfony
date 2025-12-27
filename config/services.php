<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\CKEditorTwigExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes\{CKEditorAssetsTwigWidget, CKEditorTwigWidget};

return static function (ContainerConfigurator $container): void {
    $container
        ->services()
            ->defaults()
                ->autowire()
                ->autoconfigure()
        ->set(ConfigManager::class)
        ->set(CKEditorTwigExtension::class)
        ->set(CKEditorAssetsTwigWidget::class)
        ->set(CKEditorTwigWidget::class);
};
