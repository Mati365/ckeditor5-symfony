<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Livewire\Exceptions\NoCloudConfig;
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;
use Mati365\CKEditor5Symfony\Cloud\{CloudBundleBuilder, CloudSingletonLoader};

/**
 * CKEditor 5 Assets Twig Widget.
 */
class CKEditorCloudAssetsRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
        private ConfigManager $configManager,
        private CloudSingletonLoader $cloudLoader,
    ) {}

    /**
     * Render the CKEditor widget.
     *
     * @param string $preset The preset name to use (default: `default`). Such preset should contain cloud configuration.
     * It'll be ignored if cloud was configured via `ckeditor5:sitemap:install` command.
     * @param string|null $nonce Optional nonce for CSP
     * @param bool $emitImportMap Whether to emit the import map script tag
     * @param array $customImportMap Custom import map entries to merge
     * @return string Rendered HTML
     */
    public function render(
        string $preset = 'default',
        ?string $nonce = null,
        bool $emitImportMap = false,
        array $customImportMap = []
    ): string {
        $cloud = $this->cloudLoader->load();
        $cloud ??= $this->configManager->resolvePresetOrThrow($preset)->cloud;

        if ($cloud == null) {
            throw new NoCloudConfig();
        }

        // Group JS assets.
        $bundle = CloudBundleBuilder::build($cloud);
        $esmAssets = [];
        $umdAssets = [];
        $generatedImportMap = [];

        foreach ($bundle->js as $asset) {
            switch ($asset->type) {
                case JSAssetType::ESM:
                    $esmAssets[] = $asset;
                    $generatedImportMap[$asset->name] = $asset->url;
                    break;

                case JSAssetType::UMD:
                    $umdAssets[] = $asset;
                    break;
            }
        }

        $finalImportMap = array_merge($generatedImportMap, $customImportMap);

        return $this->twig->render('@CKEditor5/cke5_cloud_assets.html.twig', [
            'bundle' => $bundle,
            'esm_assets' => $esmAssets,
            'umd_assets' => $umdAssets,
            'import_map' => $finalImportMap,
            'emit_import_map' => $emitImportMap,
            'nonce' => $nonce,
        ]);
    }
}
