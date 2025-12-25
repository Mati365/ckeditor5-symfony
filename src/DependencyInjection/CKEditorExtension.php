<?php

namespace Mati365\CKEditor5Symfony\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Mati365\CKEditor5Symfony\Config;

class CKEditorExtension extends Extension
{
    #[\Override]
    public function load(array $configs, ContainerBuilder $container): void
    {
        $configuration = new Configuration();

        /** @var array{presets: array<string, array>, contexts: array<string, array>} $config */
        $config = $this->processConfiguration($configuration, $configs);

        $container->register(Config::class)
            ->setPublic(false)
            ->setArguments([$config]);
    }
}
