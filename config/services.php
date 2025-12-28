<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\CKEditorTwigExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes;
use Mati365\CKEditor5Symfony\Command\ConfigureImportmapCommand;
use Mati365\CKEditor5Symfony\Command\Installer;
use Mati365\CKEditor5Symfony\Command\Installer\Strategy;

return static function (ContainerConfigurator $container): void {
    $container
        ->services()
            ->defaults()
                ->autowire()
                ->autoconfigure()
        ->set(ConfigManager::class)
        ->set(CKEditorTwigExtension::class)
        ->set(ConfigureImportmapCommand::class)
        ->set(Strategy\CloudInstallerStrategy::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Strategy\NpmInstallerStrategy::class)
        ->set(Installer\NpmPackageInstaller::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\ImportmapManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\TwigManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Runtimes\CKEditorAssetsRuntime::class)
        ->set(Runtimes\CKEditorHiddenInputRuntime::class)
        ->set(Runtimes\CKEditorRuntime::class);
};
