<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Mati365\CKEditor5Symfony\Command\Installer\NpmPackageInstaller;
use Mati365\CKEditor5Symfony\Command\Installer\{TwigManipulator, CSSManipulator};
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Strategy for configuring CKEditor5 assets for NPM distribution.
 */
class NpmInstallerStrategy implements InstallerStrategyInterface
{
    public function __construct(
        private NpmPackageInstaller $npmInstaller,
        private TwigManipulator $twigManipulator,
        private CSSManipulator $cssManipulator
    ) {}

    #[\Override]
    public function supports(string $distribution): bool
    {
        return $distribution === 'npm';
    }

    #[\Override]
    public function configureImportmap(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        $basePath = 'assets/vendor/ckeditor5';
        $premiumPath = 'assets/vendor/ckeditor5-premium-features';

        $version = $input->getOption('editor-version');
        $isPremium = $input->getOption('premium');
        $translations = array_map('trim', explode(',', $input->getOption('translations')));

        $io->info("Downloading ckeditor5@$version to $basePath...");
        $this->npmInstaller->downloadAndExtract('ckeditor5', $version);
        $importmap['ckeditor5'] = ['path' => "./$basePath/dist/browser/ckeditor5.js"];

        if ($isPremium) {
            $io->info("Downloading ckeditor5-premium-features@$version to $premiumPath...");
            $this->npmInstaller->downloadAndExtract('ckeditor5-premium-features', $version);
            $importmap['ckeditor5-premium-features'] = [
                'path' => "./$premiumPath/dist/browser/ckeditor5-premium-features.js",
            ];
        }

        foreach ($translations as $lang) {
            $importmap["ckeditor5/translations/{$lang}.js"] = [
                'path' => "./$basePath/dist/translations/{$lang}.js",
            ];

            if ($isPremium) {
                $importmap["ckeditor5-premium-features/translations/{$lang}.js"] = [
                    'path' => "./$premiumPath/dist/translations/{$lang}.js",
                ];
            }
        }

        return $importmap;
    }

    #[\Override]
    public function updateTwig(InputInterface $input, SymfonyStyle $io): void
    {
        if ($input->getOption('skip-template-update')) {
            return;
        }

        $templatePath = $input->getOption('template-path');
        $blockName = 'ckeditor5_assets';

        $io->note("Removing '$blockName' block from template: $templatePath");
        $this->twigManipulator->removeBlock(
            $templatePath,
            $blockName
        );
    }

    #[\Override]
    public function updateCss(InputInterface $input, SymfonyStyle $io): void
    {
        if ($input->getOption('skip-css-update')) {
            return;
        }

        $cssPath = $input->getOption('css-path');
        $cssImports = ['../vendor/ckeditor5/dist/browser/ckeditor5.css'];

        if ($input->getOption('premium') || $input->getOption('distribution') === 'cloud') {
            $cssImports[] = '../vendor/ckeditor5-premium-features/dist/browser/ckeditor5-premium-features.css';
        }

        foreach ($cssImports as $importUrl) {
            $io->note("Adding CSS import for '$importUrl'...");
            $this->cssManipulator->addImport($cssPath, $importUrl);
        }
    }
}
