<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\CKEditorTwigExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes;
use Mati365\CKEditor5Symfony\Command\{Installer, InstallImportmapCommand};
use Mati365\CKEditor5Symfony\Command\Installer\Strategy;
use Mati365\CKEditor5Symfony\Cloud\CloudSingletonLoader;

return static function (ContainerConfigurator $container): void {
    $container
        ->services()
            ->defaults()
                ->autowire()
                ->autoconfigure()
        ->set(ConfigManager::class)
        ->set(CKEditorTwigExtension::class)
        ->set(InstallImportmapCommand::class)
        ->set(Strategy\CloudInstallerStrategy::class)
            ->tag('mati365.ckeditor5.installer_strategy')
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Strategy\NpmInstallerStrategy::class)
            ->tag('mati365.ckeditor5.installer_strategy')
        ->set(Installer\NpmPackageInstaller::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\ImportmapManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\TwigManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\ComposerManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(Installer\CSSManipulator::class)
            ->bind('$projectDir', '%kernel.project_dir%')
        ->set(CloudSingletonLoader::class)
            ->args(['%kernel.project_dir%/assets/vendor/ckeditor5-cloud/cloud.json'])
        ->set(Runtimes\CKEditorCloudAssetsRuntime::class)
        ->set(Runtimes\CKEditorHiddenInputRuntime::class)
        ->set(Runtimes\CKEditorRuntime::class);
};
