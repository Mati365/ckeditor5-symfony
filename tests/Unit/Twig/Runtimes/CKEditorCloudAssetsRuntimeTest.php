<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use Twig\Environment;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Mati365\CKEditor5Symfony\Cloud\{Cloud, CloudLoaderInterface};
use Mati365\CKEditor5Symfony\Cloud\Bundle\JSAssetType;
use Mati365\CKEditor5Symfony\Cloud\CKBox\CKBox;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorCloudAssetsRuntime;
use Mati365\CKEditor5Symfony\Exceptions\NoCloudConfig;
use Mati365\CKEditor5Symfony\Exceptions\CloudLicenseIncompatible;
use Mati365\CKEditor5Symfony\Tests\Helpers\LicenseKeyHelper;

class CKEditorCloudAssetsRuntimeTest extends TestCase
{
    private Environment&MockObject $mockTwig;

    protected function setUp(): void
    {
        $this->mockTwig = $this->createMock(Environment::class);
    }

    /**
     * Builds a ConfigManager with a single 'default' preset.
     * Pass only the keys you care about; the rest receive sensible defaults.
     */
    private function makeConfigManager(array $presetOverrides = []): ConfigManager
    {
        $preset = array_merge(
            [
                'editorType' => 'classic',
                'config'     => [],
                'licenseKey' => LicenseKeyHelper::createRaw(),
                'cloud'      => ['editorVersion' => '42.0.0', 'premium' => false],
            ],
            $presetOverrides,
        );

        return new ConfigManager(['presets' => ['default' => $preset]]);
    }

    /**
     * Returns a stub loader that always returns the given Cloud (or null).
     */
    private function makeLoaderStub(?Cloud $cloud = null): CloudLoaderInterface
    {
        $stub = $this->createStub(CloudLoaderInterface::class);
        $stub->method('load')->willReturn($cloud);
        return $stub;
    }

    /**
     * Captures the context array passed to Twig::render() and returns it
     * by reference so individual tests can run their own assertions on it.
     * Also makes Twig return the given $returnValue.
     */
    private function captureTwigContext(?array &$context, string $returnValue = ''): void
    {
        $this->mockTwig
            ->expects($this->once())
            ->method('render')
            ->willReturnCallback(function (string $template, array $ctx) use (&$context, $returnValue) {
                $context = $ctx;
                return $returnValue;
            });
    }

    private function makeRuntime(ConfigManager $configManager, CloudLoaderInterface $loader): CKEditorCloudAssetsRuntime
    {
        return new CKEditorCloudAssetsRuntime($this->mockTwig, $configManager, $loader);
    }

    public function testRenderThrowsExceptionWhenNoCloudConfig(): void
    {
        $configManager = new ConfigManager([
            'presets' => [
                'default' => ['editorType' => 'classic', 'config' => []],
            ],
        ]);

        $this->expectException(NoCloudConfig::class);

        $this->makeRuntime($configManager, $this->makeLoaderStub())->render();
    }

    public function testRenderThrowsExceptionWhenSelfHostedLicenseUsed(): void
    {
        $configManager = $this->makeConfigManager([
            'licenseKey' => LicenseKeyHelper::createSelfHosted(),
        ]);

        $this->expectException(CloudLicenseIncompatible::class);

        $this->makeRuntime($configManager, $this->makeLoaderStub())->render();
    }

    public function testRenderCallsCorrectTwigTemplate(): void
    {
        $this->mockTwig
            ->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_cloud_assets.html.twig', $this->anything())
            ->willReturn('<html></html>');

        $result = $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        $this->assertSame('<html></html>', $result);
    }

    public function testRenderWithNamedPreset(): void
    {
        $configManager = new ConfigManager([
            'presets' => [
                'custom_preset' => [
                    'editorType' => 'classic',
                    'config'     => [],
                    'licenseKey' => LicenseKeyHelper::createRaw(),
                    'cloud'      => ['editorVersion' => '43.0.0', 'premium' => false],
                ],
            ],
        ]);

        $context = [];
        $this->captureTwigContext($context, '<html></html>');

        $result = $this->makeRuntime($configManager, $this->makeLoaderStub())->render('custom_preset');

        $this->assertSame('<html></html>', $result);
        $this->assertTwigContextHasRequiredKeys($context);
    }

    public function testRenderPassesRequiredKeysToTwig(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        $this->assertTwigContextHasRequiredKeys($context);
    }

    private function assertTwigContextHasRequiredKeys(array $context): void
    {
        foreach (['bundle', 'esm_assets', 'umd_assets', 'import_map'] as $key) {
            $this->assertArrayHasKey($key, $context, "Twig context is missing key '{$key}'.");
        }
    }

    public function testRenderUsesCloudLoaderWhenNoBundleInPreset(): void
    {
        $configManager = $this->makeConfigManager(['cloud' => null]);

        $cloud      = new Cloud('42.0.0', true, ['fr']);
        $mockLoader = $this->createMock(CloudLoaderInterface::class);
        $mockLoader->expects($this->once())->method('load')->willReturn($cloud);

        $context = [];
        $this->captureTwigContext($context, 'rendered_assets');

        $result = $this->makeRuntime($configManager, $mockLoader)->render();

        $this->assertSame('rendered_assets', $result);
        $this->assertTwigContextHasRequiredKeys($context);
    }

    public function testRenderForwardsNonceToTwigContext(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())
            ->render('default', 'my_nonce');

        $this->assertSame('my_nonce', $context['nonce']);
    }

    public function testRenderForwardsEmitImportMapFlagToTwigContext(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())
            ->render('default', null, true);

        $this->assertTrue($context['emit_import_map']);
    }

    public function testRenderMergesCustomImportMapEntries(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $customImportMap = ['my-pkg' => 'https://example.com/my-pkg.js'];

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())
            ->render('default', null, false, $customImportMap);

        $this->assertArrayHasKey('my-pkg', $context['import_map']);
        $this->assertSame('https://example.com/my-pkg.js', $context['import_map']['my-pkg']);
    }

    public function testEsmAssetsAreAllTaggedWithEsmType(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        foreach ($context['esm_assets'] as $asset) {
            $this->assertSame(
                JSAssetType::ESM,
                $asset->type,
                "Expected ESM type for asset '{$asset->name}'.",
            );
        }
    }

    public function testEsmAssetsAreRegisteredInImportMap(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        foreach ($context['esm_assets'] as $asset) {
            $this->assertArrayHasKey(
                $asset->name,
                $context['import_map'],
                "ESM asset '{$asset->name}' is missing from the import map.",
            );
        }
    }

    public function testUmdAssetsAreAllTaggedWithUmdType(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        foreach ($context['umd_assets'] as $asset) {
            $this->assertSame(
                JSAssetType::UMD,
                $asset->type,
                "Expected UMD type for asset '{$asset->name}'.",
            );
        }
    }

    public function testCkeditor5AssetIsPresentInImportMap(): void
    {
        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($this->makeConfigManager(), $this->makeLoaderStub())->render();

        $this->assertArrayHasKey('ckeditor5', $context['import_map']);
    }

    public function testCkBoxAssetIsAddedToUmdAssets(): void
    {
        $configManager = $this->makeConfigManager(['cloud' => null]);
        $cloud         = new Cloud('42.0.0', false, [], new CKBox('1.2.3', 'dark'));

        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($configManager, $this->makeLoaderStub($cloud))->render();

        $ckboxAsset = $this->findAssetByName($context['umd_assets'], 'ckbox');

        $this->assertNotNull($ckboxAsset, 'CKBox asset is missing from umd_assets.');
        $this->assertSame(JSAssetType::UMD, $ckboxAsset->type);
    }

    public function testCkBoxAssetUrlContainsVersion(): void
    {
        $configManager = $this->makeConfigManager(['cloud' => null]);
        $cloud = new Cloud('42.0.0', false, [], new CKBox('1.2.3', 'dark'));

        $context = [];
        $this->captureTwigContext($context);

        $this->makeRuntime($configManager, $this->makeLoaderStub($cloud))->render();

        $ckboxAsset = $this->findAssetByName($context['umd_assets'], 'ckbox');

        $this->assertNotNull($ckboxAsset);
        $this->assertStringContainsString('1.2.3/ckbox.js', $ckboxAsset->url);
    }

    private function findAssetByName(array $assets, string $name): ?object
    {
        foreach ($assets as $asset) {
            if ($asset->name === $name) {
                return $asset;
            }
        }

        return null;
    }
}
