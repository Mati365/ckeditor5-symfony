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
    private const BASE_PATH = 'assets/vendor/ckeditor5';

    private const PREMIUM_PATH = 'assets/vendor/ckeditor5-premium-features';

    public function __construct(
        private NpmPackageInstaller $npmInstaller
    ) {}

    #[\Override]
    public function configure(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        $version = $input->getOption('editor-version');
        $isPremium = $input->getOption('premium');
        $translations = array_map('trim', explode(',', $input->getOption('translations')));

        $io->info("Downloading ckeditor5@$version to " . self::BASE_PATH . "...");
        $this->npmInstaller->downloadAndExtract('ckeditor5', $version);
        $importmap['ckeditor5'] = ['path' => "./" . self::BASE_PATH . "/dist/ckeditor5.js"];

        if ($isPremium) {
            $io->info("Downloading ckeditor5-premium-features@$version to " . self::PREMIUM_PATH . "...");
            $this->npmInstaller->downloadAndExtract('ckeditor5-premium-features', $version);
            $importmap['ckeditor5-premium-features'] = [
                'path' => "./" . self::PREMIUM_PATH . "/dist/ckeditor5-premium-features.js",
            ];
        }

        foreach ($translations as $lang) {
            $importmap["ckeditor5/translations/{$lang}.js"] = [
                'path' => "./" . self::BASE_PATH . "/dist/translations/{$lang}.js",
            ];

            if ($isPremium) {
                $importmap["ckeditor5-premium-features/translations/{$lang}.js"] = [
                    'path' => "./" . self::PREMIUM_PATH . "/dist/translations/{$lang}.js",
                ];
            }
        }

        return $importmap;
    }

    #[\Override]
    public function supports(string $distribution): bool
    {
        return $distribution === 'npm';
    }
}
