<?php

namespace Mati365\CKEditor5Symfony\Language;

use InvalidArgumentException;

/**
 * Parser for CKEditor 5 language configuration.
 * Normalizes language settings from various input formats.
 */
final class LanguageParser
{
    /**
     * Parses language configuration from a string or array.
     * If a string is provided, both UI and content languages are set to the same normalized value.
     * If an array is provided, it should contain 'ui' and/or 'content' keys.
     *
     * @param string|array $input The language configuration input.
     * @return Language The parsed and normalized Language object.
     * @throws InvalidArgumentException If the input format is invalid.
     */
    public static function parse(string|array|null $input): Language
    {
        if (is_string($input)) {
            return new Language($input, $input);
        }

        // At this point, $input is an array
        $ui = 'en';
        $content = 'en';

        if (is_array($input)) {
            if (isset($input['ui']) && is_string($input['ui'])) {
                $ui = $input['ui'];
            }

            if (isset($input['content']) && is_string($input['content'])) {
                $content = $input['content'];
            }
        }

        return new Language($ui, $content);
    }
}
