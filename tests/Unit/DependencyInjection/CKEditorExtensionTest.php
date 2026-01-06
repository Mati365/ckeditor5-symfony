<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\AssetMapper\AssetMapperInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Mati365\CKEditor5Symfony\DependencyInjection\CKEditorExtension;
use Mati365\CKEditor5Symfony\Service\ConfigManager;

class CKEditorExtensionTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        if (!interface_exists(AssetMapperInterface::class)) {
            eval('namespace Symfony\Component\AssetMapper; interface AssetMapperInterface {}');
        }
    }

    public function testGetAlias(): void
    {
        $extension = new CKEditorExtension();
        $this->assertEquals('ckeditor5', $extension->getAlias());
    }

    public function testDefaultConfigurationSeparated(): void
    {
        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();

        $extension->load([], $container);

        $this->assertTrue($container->hasDefinition(ConfigManager::class));

        $definition = $container->getDefinition(ConfigManager::class);
        $this->assertCount(1, $definition->getArguments());

        $config = $definition->getArgument(0);
        $this->assertIsArray($config);
        $this->assertArrayHasKey('presets', $config);
        $this->assertArrayHasKey('contexts', $config);
    }

    public function testPrependAddsDefaultConfig(): void
    {
        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();
        $container->setParameter('kernel.bundles_metadata', []);

        $extension->prepend($container);

        $configs = $container->getExtensionConfig('ckeditor5');

        // DefaultConfiguration.php returns an array. prependExtensionConfig appends it.
        // Since we are starting with empty, we expect 1 config.
        $this->assertCount(1, $configs);
        $this->assertArrayHasKey('presets', $configs[0]);
        $this->assertArrayHasKey('default', $configs[0]['presets']);
    }

    public function testPrependWithTwig(): void
    {
        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();
        $container->setParameter('kernel.bundles_metadata', []);

        // Mock presence of twig extension
        $container->registerExtension(new class extends \Symfony\Component\DependencyInjection\Extension\Extension {
            public function load(array $configs, ContainerBuilder $container): void {}
            public function getAlias(): string
            {
                return 'twig';
            }
        });

        $extension->prepend($container);

        $twigConfig = $container->getExtensionConfig('twig');
        $this->assertNotEmpty($twigConfig);

        // Check if form_themes includes the bundle one
        $found = false;

        foreach ($twigConfig as $config) {
            if (isset($config['form_themes']) && in_array('@CKEditor5/cke5_form_type.html.twig', $config['form_themes'])) {
                $found = true;
                break;
            }
        }

        $this->assertTrue($found, 'Twig configuration should include CKEditor5 form theme');
    }

    public function testPrependWithAssetMapper(): void
    {
        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();

        $container->setParameter('kernel.bundles_metadata', [
            'FrameworkBundle' => [
                'path' => __DIR__ . '/Fixtures/FrameworkBundle', // Fake path
                'namespace' => 'Symfony\Bundle\FrameworkBundle',
            ],
        ]);

        // Create a fake asset_mapper.php to simulate support
        $fixturesDir = __DIR__ . '/Fixtures/FrameworkBundle/Resources/config';

        if (!is_dir($fixturesDir)) {
            mkdir($fixturesDir, 0o777, true);
        }

        touch($fixturesDir . '/asset_mapper.php');

        try {
            $extension->prepend($container);

            $frameworkConfig = $container->getExtensionConfig('framework');
            // Logic in CKEditorExtension: checks if asset_mapper.php exists in FrameworkBundle.

            // If successful, it prepends framework config.
            $found = false;
            foreach ($frameworkConfig as $config) {
                if (isset($config['asset_mapper'])) {
                    $found = true;
                    break;
                }
            }
            $this->assertTrue($found, 'Framework configuration should include asset_mapper settings when available');

        } finally {
            if (file_exists($fixturesDir . '/asset_mapper.php')) {
                unlink($fixturesDir . '/asset_mapper.php');
            }
        }
    }

    public function testPrependWithAssetMapperMissingMetadata(): void
    {
        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();

        // Metadata missing
        $container->setParameter('kernel.bundles_metadata', []);

        $extension->prepend($container);

        $frameworkConfig = $container->getExtensionConfig('framework');
        $found = false;
        foreach ($frameworkConfig as $config) {
            if (isset($config['asset_mapper'])) {
                $found = true;
                break;
            }
        }
        $this->assertFalse($found, 'Framework configuration should NOT include asset_mapper settings when metadata is missing');
    }
}
