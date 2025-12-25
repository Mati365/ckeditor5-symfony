<?php

namespace Mati365\CKEditor5Symfony\DependencyInjection;

use Symfony\Component\DependencyInjection\{Loader, ContainerBuilder};
use Symfony\Component\DependencyInjection\Extension\{Extension, PrependExtensionInterface};
use Symfony\Component\Config\FileLocator;
use Symfony\Component\AssetMapper\AssetMapperInterface;

/**
 * CKEditor 5 Symfony Extension.
 */
class CKEditorExtension extends Extension implements PrependExtensionInterface
{
    #[\Override]
    public function getAlias(): string
    {
        return 'ckeditor5';
    }

    /**
     * Loads the CKEditor 5 configuration into the service container.
     */
    #[\Override]
    public function load(array $configs, ContainerBuilder $container): void
    {
        $loader = new Loader\PhpFileLoader($container, new FileLocator(__DIR__ . '/../../config'));
        $loader->load('services.php');

        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $container
            ->getDefinition('ckeditor5.config')
            ->addArgument($config);
    }

    /**
     * Prepends configuration to enable Asset Mapper integration if available.
     */
    #[\Override]
    public function prepend(ContainerBuilder $container): void
    {
        if (!$this->isAssetMapperAvailable($container)) {
            return;
        }

        $container->prependExtensionConfig('framework', [
            'asset_mapper' => [
                'paths' => [
                    __DIR__ . '/../../npm_package/dist' => '@mati365/ckeditor5-symfony',
                ],
                'importmap_script_attributes' => [
                    'data-turbo-track' => 'reload',
                ],
            ],
        ]);
    }

    /**
     * Checks if the Asset Mapper component is available.
     */
    private function isAssetMapperAvailable(ContainerBuilder $container): bool
    {
        if (!interface_exists(AssetMapperInterface::class)) {
            return false;
        }

        // check that FrameworkBundle 6.3 or higher is installed.
        $bundlesMetadata = $container->getParameter('kernel.bundles_metadata');

        if (!is_array($bundlesMetadata) || !isset($bundlesMetadata['FrameworkBundle']) || !is_array($bundlesMetadata['FrameworkBundle'])) {
            return false;
        }

        return is_file((string) $bundlesMetadata['FrameworkBundle']['path'] . '/Resources/config/asset_mapper.php');
    }
}
