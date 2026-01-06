<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Cloud\{Cloud, CloudLoaderInterface};
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorCloudAssetsRuntime;
use Mati365\CKEditor5Symfony\Exceptions\NoCloudConfig;

class CKEditorCloudAssetsRuntimeTest extends TestCase
{
    public function testRenderThrowsExceptionWhenNoCloudConfig(): void
    {
        $twig = $this->createMock(Environment::class);
        $config = [
            'presets' => [
                'default' => [
                    'editorType' => 'classic',
                    'config' => [],
                ],
            ],
        ];
        $configManager = new ConfigManager($config);
        $cloudLoader = $this->createMock(CloudLoaderInterface::class);
        $cloudLoader->method('load')->willReturn(null);

        $runtime = new CKEditorCloudAssetsRuntime($twig, $configManager, $cloudLoader);

        $this->expectException(NoCloudConfig::class);
        $runtime->render();
    }

    public function testRenderWithConfiguredPreset(): void
    {
        $mockTwig = $this->createMock(Environment::class);
        $config = [
            'presets' => [
                'custom_preset' => [
                    'editorType' => 'classic',
                    'config' => [],
                    'cloud' => [
                        'editorVersion' => '43.0.0',
                        'premium' => false,
                    ],
                ],
            ],
        ];
        $configManager = new ConfigManager($config);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);

        // Scenario: Loader returns null, but preset has cloud config
        $mockLoader->method('load')->willReturn(null);

        $mockTwig->expects($this->once())
            ->method('render')
            ->with(
                '@CKEditor5/cke5_cloud_assets.html.twig',
                $this->callback(function (array $context) {
                    return isset($context['bundle'])
                        && isset($context['esm_assets'])
                        && isset($context['umd_assets'])
                        && isset($context['import_map']);
                })
            )
            ->willReturn('<html></html>');

        $runtime = new CKEditorCloudAssetsRuntime($mockTwig, $configManager, $mockLoader);
        $result = $runtime->render('custom_preset');

        $this->assertEquals('<html></html>', $result);
    }

    public function testRenderWithCloudLoader(): void
    {
        $mockTwig = $this->createMock(Environment::class);
        $configManager = new ConfigManager([]);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);

        $cloud = new Cloud('42.0.0', true, ['fr']);
        $mockLoader->expects($this->once())->method('load')->willReturn($cloud);

        $mockTwig->expects($this->once())
            ->method('render')
            ->with(
                '@CKEditor5/cke5_cloud_assets.html.twig',
                $this->callback(function (array $context) {
                    return isset($context['bundle'])
                        && isset($context['esm_assets'])
                        && isset($context['umd_assets'])
                        && isset($context['import_map']);
                })
            )
            ->willReturn('rendered_assets');

        $runtime = new CKEditorCloudAssetsRuntime($mockTwig, $configManager, $mockLoader);
        $result = $runtime->render();

        $this->assertEquals('rendered_assets', $result);
    }

    public function testRenderHandlesOptionsAndImportMap(): void
    {
        $mockTwig = $this->createMock(Environment::class);
        $configManager = new ConfigManager([]);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);

        $cloud = new Cloud('42.0.0', false, []);
        $mockLoader->method('load')->willReturn($cloud);

        $customImportMap = ['pkg' => 'https://example.com/pkg.js'];
        $nonce = 'random_nonce';
        $emitImportMap = true;

        $mockTwig->expects($this->once())
            ->method('render')
            ->with(
                '@CKEditor5/cke5_cloud_assets.html.twig',
                $this->callback(function (array $context) use ($customImportMap, $nonce, $emitImportMap) {
                    // Check if custom import map is merged
                    if (!isset($context['import_map']['pkg']) || $context['import_map']['pkg'] !== 'https://example.com/pkg.js') {
                        return false;
                    }

                    // Check if generated import map is also present (ckeditor5 asset)
                    // We assume CloudBundleBuilder creates 'ckeditor5' asset for version 42.0.0
                    $foundCkeditor5 = false;
                    foreach ($context['import_map'] as $key => $value) {
                        if ($key === 'ckeditor5') {
                            $foundCkeditor5 = true;
                            break;
                        }
                    }
                    if (!$foundCkeditor5) {
                        return false;
                    }

                    if ($context['nonce'] !== $nonce) {
                        return false;
                    }
                    if ($context['emit_import_map'] !== $emitImportMap) {
                        return false;
                    }
                    return true;
                })
            )
            ->willReturn('');

        $runtime = new CKEditorCloudAssetsRuntime($mockTwig, $configManager, $mockLoader);
        $runtime->render('default', $nonce, $emitImportMap, $customImportMap);
    }

    public function testRenderPartitionsAssets(): void
    {
        $mockTwig = $this->createMock(Environment::class);
        $configManager = new ConfigManager([]);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);

        $cloud = new Cloud('42.0.0', false, []);
        $mockLoader->method('load')->willReturn($cloud);

        $mockTwig->expects($this->once())
            ->method('render')
            ->with(
                '@CKEditor5/cke5_cloud_assets.html.twig',
                $this->callback(function (array $context) {
                    $esmAssets = $context['esm_assets'];
                    $umdAssets = $context['umd_assets'];
                    $importMap = $context['import_map'];

                    // Check that assets are correctly typed
                    foreach ($esmAssets as $asset) {
                        if ($asset->type !== JSAssetType::ESM) {
                            return false;
                        }
                        // ESM assets should be in import map
                        if (!isset($importMap[$asset->name])) {
                            return false;
                        }
                    }

                    foreach ($umdAssets as $asset) {
                        if ($asset->type !== JSAssetType::UMD) {
                            return false;
                        }
                    }

                    return true;
                })
            )
            ->willReturn('');

        $runtime = new CKEditorCloudAssetsRuntime($mockTwig, $configManager, $mockLoader);
        $runtime->render();
    }

    public function testRenderIncludesUMDAssetsForCKBox(): void
    {
        $mockTwig = $this->createMock(Environment::class);
        $configManager = new ConfigManager([]);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);

        $ckbox = new \Mati365\CKEditor5Symfony\Cloud\CKBox\CKBox('1.2.3', 'dark');
        $cloud = new Cloud('42.0.0', false, [], $ckbox);

        $mockLoader->method('load')->willReturn($cloud);

        $mockTwig->expects($this->once())
            ->method('render')
            ->with(
                '@CKEditor5/cke5_cloud_assets.html.twig',
                $this->callback(function (array $context) {
                    $umdAssets = $context['umd_assets'];

                    // Verify CKBox assets are present in UMD assets
                    $hasCKBox = false;
                    foreach ($umdAssets as $asset) {
                        if ($asset->name === 'ckbox' && $asset->type === JSAssetType::UMD) {
                            $hasCKBox = true;

                            // Check URL construction
                            if (strpos($asset->url, '1.2.3/ckbox.js') === false) {
                                return false;
                            }
                        }
                    }

                    return $hasCKBox;
                })
            )
            ->willReturn('<html></html>');

        $runtime = new CKEditorCloudAssetsRuntime($mockTwig, $configManager, $mockLoader);
        $runtime->render();
    }
}
