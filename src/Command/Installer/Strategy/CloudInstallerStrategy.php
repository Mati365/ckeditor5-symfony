<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Mati365\CKEditor5Symfony\Cloud\{Cloud, CloudBundleBuilder, CKBox\CKBox};
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Strategy for configuring CKEditor5 assets for cloud distribution.
 */
class CloudInstallerStrategy implements InstallerStrategyInterface
{
    #[\Override]
    public function configure(InputInterface $input, SymfonyStyle $io, array $importmap): array
    {
        $ckboxVersion = $input->getOption('ckbox-version');
        $translations = array_map('trim', explode(',', $input->getOption('translations') ?? 'en'));

        $cloud = new Cloud(
            editorVersion: $input->getOption('editor-version'),
            premium: $input->getOption('premium'),
            ckbox: isset($ckboxVersion) ? new CKBox(version: $ckboxVersion) : null,
            translations: $translations
        );

        $bundle = CloudBundleBuilder::build($cloud);

        foreach ($bundle->js as $asset) {
            $importmap[$asset->name] = ['path' => $asset->url];
        }

        return $importmap;
    }
}
