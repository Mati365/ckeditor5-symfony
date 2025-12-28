<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\CKEditorTwigExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes;

return static function (ContainerConfigurator $container): void {
    $container
        ->services()
            ->defaults()
                ->autowire()
                ->autoconfigure()
        ->set(ConfigManager::class)
        ->set(CKEditorTwigExtension::class)
        ->set(Runtimes\CKEditorAssetsRuntime::class)
        ->set(Runtimes\CKEditorHiddenInputRuntime::class)
        ->set(Runtimes\CKEditorRuntime::class);
};
