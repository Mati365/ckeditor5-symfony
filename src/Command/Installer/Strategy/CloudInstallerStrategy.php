<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;
use Mati365\CKEditor5Symfony\Cloud\{Cloud, CloudBundleBuilder, CKBox\CKBox};
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;

/**
 * Strategy for configuring CKEditor5 assets for cloud distribution.
 */
class CloudInstallerStrategy implements InstallerStrategyInterface
{
    public function __construct(
        private string $projectDir,
        private Filesystem $filesystem
    ) {}

    #[\Override]
    public function configure(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        /** @var string|null $ckboxVersion */
        $ckboxVersion = $input->getOption('ckbox-version');
        $translations = array_map('trim', explode(',', (string) ($input->getOption('translations') ?? 'en')));

        $cloud = new Cloud(
            editorVersion: (string) $input->getOption('editor-version'),
            premium: (bool) $input->getOption('premium'),
            ckbox: isset($ckboxVersion) ? new CKBox(version: $ckboxVersion) : null,
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

        return $importmap;
    }
}
