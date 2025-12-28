<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Mati365\CKEditor5Symfony\Command\Installer\NpmPackageInstaller;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Strategy for configuring CKEditor5 assets for NPM distribution.
 */
class NpmInstallerStrategy implements InstallerStrategyInterface
{
    public function __construct(private NpmPackageInstaller $npmInstaller) {}

    #[\Override]
    public function configure(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        $version = (string) $input->getOption('editor-version');
        $isPremium = (bool) $input->getOption('premium');
        $translations = array_map('trim', explode(',', (string) ($input->getOption('translations') ?? 'en')));

        $io->info("Downloading ckeditor5@$version...");
        $this->npmInstaller->downloadAndExtract('ckeditor5', $version);
        $importmap['ckeditor5'] = ['path' => './assets/vendor/ckeditor5/dist/ckeditor5.js'];

        if ($isPremium) {
            $io->info("Downloading ckeditor5-premium-features@$version...");
            $this->npmInstaller->downloadAndExtract('ckeditor5-premium-features', $version);
            $importmap['ckeditor5-premium-features'] = [
                'path' => './assets/vendor/ckeditor5-premium-features/dist/ckeditor5-premium-features.js',
            ];
        }

        foreach ($translations as $lang) {
            $importmap["ckeditor5/translations/{$lang}.js"] = ['path' => "./assets/vendor/ckeditor5/dist/translations/{$lang}.js"];
            if ($isPremium) {
                $importmap["ckeditor5-premium-features/translations/{$lang}.js"] = ['path' => "./assets/vendor/ckeditor5-premium-features/dist/translations/{$lang}.js"];
            }
        }

        return $importmap;
    }
}
