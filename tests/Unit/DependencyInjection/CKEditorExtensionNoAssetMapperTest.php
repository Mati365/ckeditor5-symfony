<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\AssetMapper\AssetMapperInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Mati365\CKEditor5Symfony\DependencyInjection\CKEditorExtension;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
class CKEditorExtensionNoAssetMapperTest extends TestCase
{
    public function testPrependDoesNothingIfInterfaceMissing(): void
    {
        if (interface_exists(AssetMapperInterface::class)) {
            $this->markTestSkipped('AssetMapperInterface exists. Cannot test the missing interface path.');
        }

        $extension = new CKEditorExtension();
        $container = new ContainerBuilder();
        // We don't need to set kernel.bundles_metadata because the code returns false before checking it
        // which verifies that we hit the early return.

        $extension->prepend($container);

        // Check that NO framework config with asset_mapper was added
        $frameworkConfig = $container->getExtensionConfig('framework');
        $found = false;
        foreach ($frameworkConfig as $config) {
            if (isset($config['asset_mapper'])) {
                $found = true;
                break;
            }
        }
        $this->assertFalse($found, 'AssetMapper config should NOT be prepended when interface is missing.');
    }
}
