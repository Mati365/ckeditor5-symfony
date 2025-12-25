<?php

namespace Mati365\CKEditor5Symfony\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

/**
 * CKEditor 5 Symfony Configuration.
 */
class Configuration implements ConfigurationInterface
{
    #[\Override]
    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('ckeditor5');
        $rootNode = $treeBuilder->getRootNode();

        $rootNode
            ->children()
                ->arrayNode('presets')
                    ->useAttributeAsKey('name')
                    ->arrayPrototype()
                        ->children()
                            ->scalarNode('editorType')->isRequired()->cannotBeEmpty()->end()
                            ->variableNode('config')->defaultValue([])->end()
                            ->scalarNode('licenseKey')->defaultNull()->end()
                            ->variableNode('cloud')->defaultNull()->end()
                            ->variableNode('customTranslations')->defaultNull()->end()
                        ->end()
                    ->end()
                ->end()
                ->arrayNode('contexts')
                    ->useAttributeAsKey('name')
                    ->arrayPrototype()
                        ->children()
                            ->variableNode('config')->defaultValue([])->end()
                            ->variableNode('watchdogConfig')->defaultNull()->end()
                            ->variableNode('customTranslations')->defaultNull()->end()
                        ->end()
                    ->end()
                ->end()
            ->end();

        return $treeBuilder;
    }
}
