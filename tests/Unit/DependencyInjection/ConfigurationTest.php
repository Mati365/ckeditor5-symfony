<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;
use Symfony\Component\Config\Definition\Processor;
use Mati365\CKEditor5Symfony\DependencyInjection\Configuration;

class ConfigurationTest extends TestCase
{
    public function testDefaultParameter(): void
    {
        $processor = new Processor();
        $config = $processor->processConfiguration(new Configuration(), []);

        $this->assertEquals([
            'presets' => [],
            'contexts' => [],
        ], $config);
    }

    public function testPresetConfiguration(): void
    {
        $processor = new Processor();
        $config = $processor->processConfiguration(new Configuration(), [[
            'presets' => [
                'main' => [
                    'editorType' => 'classic',
                    'config' => ['toolbar' => ['items' => []]],
                ],
            ],
        ]]);

        $this->assertEquals([
            'presets' => [
                'main' => [
                    'editorType' => 'classic',
                    'config' => ['toolbar' => ['items' => []]],
                    'licenseKey' => null,
                    'cloud' => null,
                    'customTranslations' => null,
                ],
            ],
            'contexts' => [],
        ], $config);
    }

    public function testContextConfiguration(): void
    {
        $processor = new Processor();
        $config = $processor->processConfiguration(new Configuration(), [[
            'contexts' => [
                'main' => [
                    'config' => ['language' => 'en'],
                ],
            ],
        ]]);

        $this->assertEquals([
            'presets' => [],
            'contexts' => [
                'main' => [
                    'config' => ['language' => 'en'],
                    'watchdogConfig' => null,
                    'customTranslations' => null,
                ],
            ],
        ], $config);
    }

    public function testPresetMissingEditorType(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('The child config "editorType" under "ckeditor5.presets.main" must be configured.');

        $processor = new Processor();
        $processor->processConfiguration(new Configuration(), [[
            'presets' => [
                'main' => [
                    'config' => [],
                ],
            ],
        ]]);
    }
}
