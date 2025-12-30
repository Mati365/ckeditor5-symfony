<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;
use Mati365\CKEditor5Symfony\Cloud\{Cloud, CloudBundleBuilder, CKBox\CKBox};
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;
use Mati365\CKEditor5Symfony\Command\Installer\{TwigManipulator, CSSManipulator};

/**
 * Strategy for configuring CKEditor5 assets for cloud distribution.
 */
class CloudInstallerStrategy implements InstallerStrategyInterface
{
    public function __construct(
        private string $projectDir,
        private Filesystem $filesystem,
        private TwigManipulator $twigManipulator,
        private CSSManipulator $cssManipulator
    ) {}

    #[\Override]
    public function supports(string $distribution): bool
    {
        return $distribution === 'cloud';
    }

    #[\Override]
    public function configureImportmap(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        $ckbox = null;

        if ($input->getOption('ckbox-version') !== null) {
            $ckbox = new CKBox(
                version: (string) $input->getOption('ckbox-version'),
                theme: (string) $input->getOption('ckbox-theme')
            );
        }

        $translations = array_map('trim', explode(',', $input->getOption('translations')));
        $cloud = new Cloud(
            editorVersion: $input->getOption('editor-version'),
            premium: $input->getOption('premium'),
            ckbox: $ckbox,
            translations: $translations
        );

        $bundle = CloudBundleBuilder::build($cloud);

        // Workaround for Symfony issue with remote CDN URLs: https://github.com/symfony/symfony/issues/52304
        // Create local .mjs files that re-export from the remote URLs
        $vendorDir = $this->projectDir . '/assets/vendor/ckeditor5-cloud';
        $this->filesystem->mkdir($vendorDir);

        foreach ($bundle->js as $asset) {
            if ($asset->type !== JSAssetType::ESM || !str_starts_with($asset->url, 'https://')) {
                continue;
            }

            $fileName = (string) preg_replace('/\.(js|mjs)$/', '-$1', $asset->name) . '.mjs';
            $content = implode("\n", [
                "export * from '{$asset->url}';",
                "export { default } from '{$asset->url}';",
            ]);

            $this->filesystem->dumpFile($vendorDir . '/' . $fileName, $content);
            $importmap[$asset->name] = ['path' => './assets/vendor/ckeditor5-cloud/' . $fileName];
        }

        // Save cloud configuration as JSON
        $cloudJson = (string) json_encode($cloud, JSON_PRETTY_PRINT);
        $this->filesystem->dumpFile($vendorDir . '/cloud.json', $cloudJson);

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
        $blockContent = '{{ cke5_cloud_assets(emit_import_map: false) }}';

        $io->note("Adding '$blockName' block to template: $templatePath");
        $this->twigManipulator->addBlock(
            $templatePath,
            $blockName,
            $blockContent
        );
    }

    #[\Override]
    public function updateCss(InputInterface $input, SymfonyStyle $io): void
    {
        if ($input->getOption('skip-css-update')) {
            return;
        }

        $cssPath = $input->getOption('css-path');
        $cssImports = ['../vendor/ckeditor5/dist/ckeditor5.css'];

        if ($input->getOption('premium') || $input->getOption('distribution') === 'cloud') {
            $cssImports[] = '../vendor/ckeditor5-premium-features/dist/ckeditor5-premium-features.css';
        }

        foreach ($cssImports as $importUrl) {
            $io->note("Removing CSS import for '$importUrl'...");
            $this->cssManipulator->removeImport($cssPath, $importUrl);
        }
    }
}
