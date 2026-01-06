<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Service;

use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Exceptions\{UnknownPreset, UnknownContext};
use Mati365\CKEditor5Symfony\Preset\Preset;
use Mati365\CKEditor5Symfony\Context\Context;
use Mati365\CKEditor5Symfony\Preset\EditorType;
use Mati365\CKEditor5Symfony\License\Key;

class ConfigManagerTest extends TestCase
{
    private array $validConfig = [
        'presets' => [
            'default' => [
                'editorType' => 'classic',
                'config' => [
                    'toolbar' => ['bold', 'italic'],
                ],
            ],
        ],
        'contexts' => [
            'default' => [
                'config' => [
                    'language' => 'en',
                ],
            ],
        ],
    ];

    public function testGetRawPresetsReturnsPresets(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $this->assertEquals($this->validConfig['presets'], $manager->getRawPresets());
    }

    public function testGetRawPresetsReturnsEmptyArrayWhenNotSet(): void
    {
        $manager = new ConfigManager([]);
        $this->assertEquals([], $manager->getRawPresets());
    }

    public function testGetRawPresetsReturnsEmptyArrayWhenNotArray(): void
    {
        $manager = new ConfigManager(['presets' => 'invalid_string']);
        $this->assertEquals([], $manager->getRawPresets());
    }

    public function testGetRawContextsReturnsContexts(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $this->assertEquals($this->validConfig['contexts'], $manager->getRawContexts());
    }

    public function testGetRawContextsReturnsEmptyArrayWhenNotSet(): void
    {
        $manager = new ConfigManager([]);
        $this->assertEquals([], $manager->getRawContexts());
    }

    public function testResolvePresetOrThrowReturnsPresetInstance(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $preset = $manager->resolvePresetOrThrow('default');

        $this->assertInstanceOf(Preset::class, $preset);
        $this->assertEquals(EditorType::CLASSIC, $preset->editorType);
    }

    public function testResolvePresetOrThrowReturnsInstanceWhenInstancePassed(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $preset = new Preset([], EditorType::CLASSIC, Key::ofGPL());

        $this->assertSame($preset, $manager->resolvePresetOrThrow($preset));
    }

    public function testResolvePresetOrThrowThrowsExceptionOnInvalidName(): void
    {
        $manager = new ConfigManager($this->validConfig);

        $this->expectException(UnknownPreset::class);
        $manager->resolvePresetOrThrow('invalid_name');
    }

    public function testResolveContextOrThrowReturnsContextInstance(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $context = $manager->resolveContextOrThrow('default');

        $this->assertInstanceOf(Context::class, $context);
    }

    public function testResolveContextOrThrowReturnsInstanceWhenInstancePassed(): void
    {
        $manager = new ConfigManager($this->validConfig);
        $context = new Context([]);

        $this->assertSame($context, $manager->resolveContextOrThrow($context));
    }

    public function testResolveContextOrThrowThrowsExceptionOnInvalidName(): void
    {
        $manager = new ConfigManager($this->validConfig);

        $this->expectException(UnknownContext::class);
        $manager->resolveContextOrThrow('invalid_name');
    }
}
