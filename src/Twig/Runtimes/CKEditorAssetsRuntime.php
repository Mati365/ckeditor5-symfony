<?php

namespace Mati365\CKEditor5Symfony\Twig\Runtimes;

use Twig\Environment;
use Twig\Extension\RuntimeExtensionInterface;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Livewire\Exceptions\NoCloudConfig;
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;
use Mati365\CKEditor5Symfony\Cloud\CloudBundleBuilder;

/**
 * CKEditor 5 Assets Twig Widget.
 */
class CKEditorAssetsRuntime implements RuntimeExtensionInterface
{
    public function __construct(
        private Environment $twig,
        private ConfigManager $configManager
    ) {}

    /**
     * Render the CKEditor widget.
     *
     * @param string $preset The preset name to use (default: 'default')
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
        $resolvedPreset = $this->configManager->resolvePresetOrThrow($preset);
        $cloud = $resolvedPreset->cloud;

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

        return $this->twig->render('@CKEditor5/cke5_assets.html.twig', [
            'bundle' => $bundle,
            'esm_assets' => $esmAssets,
            'umd_assets' => $umdAssets,
            'import_map' => $finalImportMap,
            'emit_import_map' => $emitImportMap,
            'nonce' => $nonce,
        ]);
    }
}
