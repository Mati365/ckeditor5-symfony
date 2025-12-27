<?php

namespace Mati365\CKEditor5Symfony\Service;

use Mati365\CKEditor5Symfony\Preset\{Preset, PresetParser};
use Mati365\CKEditor5Symfony\Context\{Context, ContextParser};
use Mati365\CKEditor5Symfony\Exceptions\{UnknownPreset, UnknownContext};

/**
 * CKEditor 5 configuration class. It's used internally by the package.
 */
final class ConfigManager
{
    /**
     * Constructor receives the framework config repository and
     * extracts this package's configuration.
     *
     * @param array $config
     */
    public function __construct(
        protected array $config
    ) {}

    /**
     * Return the package's default editor configuration.
     * Can be called via the facade: CKEditor::getDefaultConfig()
     *
     * @return array<string, array>
     */
    public function getRawPresets(): array
    {
        $presets = $this->config['presets'] ?? [];

        if (!is_array($presets)) {
            return [];
        }

        /** @var array<string, array> $presets */
        return $presets;
    }

    /**
     * Return the package's context configurations.
     *
     * @return array<string, array>
     */
    public function getRawContexts(): array
    {
        /** @var array<string, array> $contexts */
        $contexts = $this->config['contexts'] ?? [];

        return $contexts;
    }

    /**
     * Get a preset by its name or return the preset instance directly.
     *
     * @param Preset|string $name The preset name or instance
     * @return Preset The resolved Preset instance
     * @throws UnknownPreset If the preset name does not exist in the configuration
     */
    public function resolvePresetOrThrow(Preset|string $nameOrPreset): Preset
    {
        if ($nameOrPreset instanceof Preset) {
            return $nameOrPreset;
        }

        $json = $this->getRawPresets()[$nameOrPreset] ?? null;

        if (!isset($json)) {
            throw new UnknownPreset($nameOrPreset);
        }

        return PresetParser::parse($json);
    }

    /**
     * Get a context by its name or return the context instance directly.
     *
     * @param Context|string $name The context name or instance
     * @return Context The resolved Context instance
     * @throws UnknownContext If the context name does not exist in the configuration
     */
    public function resolveContextOrThrow(Context|string $nameOrContext): Context
    {
        if ($nameOrContext instanceof Context) {
            return $nameOrContext;
        }

        $json = $this->getRawContexts()[$nameOrContext] ?? null;

        if (!isset($json)) {
            throw new UnknownContext($nameOrContext);
        }

        return ContextParser::parse($json);
    }
}
