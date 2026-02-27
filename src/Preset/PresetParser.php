<?php

namespace Mati365\CKEditor5Symfony\Preset;

use InvalidArgumentException;
use Mati365\CKEditor5Symfony\Cloud\CloudParser;
use Mati365\CKEditor5Symfony\License\{Key, KeyParser};

/**
 * Parser for Preset configuration.
 */
final class PresetParser
{
    /**
     * Parses preset data and creates a Preset instance.
     *
     * @param array $data Preset data array.
     * @return Preset The parsed Preset instance.
     * @throws InvalidArgumentException If validation fails.
     */
    public static function parse(array $data): Preset
    {
        PresetValidator::validate($data);

        $editorType = EditorType::from((string) $data['editorType']);
        $cloud = isset($data['cloud'])
            ? CloudParser::parse((array) $data['cloud'])
            : null;

        if (isset($data['licenseKey'])) {
            $licenseKey = KeyParser::parse((string) $data['licenseKey']);
        } else {
            $envKey = getenv('CKEDITOR5_LICENSE_KEY');

            if ($envKey === false) {
                $envKey = $_ENV['CKEDITOR5_LICENSE_KEY'] ?? null;
            }

            $licenseKey = $envKey !== null
                ? KeyParser::parse($envKey)
                : Key::ofGPL();
        }

        return new Preset(
            config: (array) $data['config'],
            editorType: $editorType,
            licenseKey: $licenseKey,
            cloud: $cloud,
            customTranslations: isset($data['customTranslations']) ? (array) $data['customTranslations'] : null,
        );
    }

    /**
     * Dump Preset instance to an array compatible with PresetParser::parse().
     *
     * @param Preset $preset
     * @return array
     */
    public static function dump(Preset $preset): array
    {
        $result = [
            'config' => $preset->config,
            'editorType' => $preset->editorType->value,
            'licenseKey' => KeyParser::dump($preset->licenseKey),
        ];

        if ($preset->cloud !== null) {
            $result['cloud'] = CloudParser::dump($preset->cloud);
        }

        if ($preset->customTranslations !== null) {
            $result['customTranslations'] = $preset->customTranslations;
        }

        return $result;
    }
}
