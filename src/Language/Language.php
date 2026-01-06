<?php

namespace Mati365\CKEditor5Symfony\Language;

/**
 * Represents a language configuration for CKEditor 5.
 * Contains UI language and content language settings.
 */
final class Language
{
    /**
     * Constructor for the Language class.
     *
     * @param string $ui The UI language code (e.g., 'en', 'pl').
     * @param string $content The content language code (e.g., 'en', 'pl').
     */
    public function __construct(
        public string $ui,
        public string $content,
    ) {
        $this->ui = self::normalizeLanguageCode($ui);
        $this->content = self::normalizeLanguageCode($content);
    }

    /**
     * Normalizes a language code to its primary language code supported by CKEditor.
     * For example, 'en-US' becomes 'en', 'pl-PL' becomes 'pl'.
     *
     * @param string $languageCode The language code to normalize.
     * @return string The normalized primary language code.
     */
    public static function normalizeLanguageCode(string $languageCode): string
    {
        // Use PHP's Locale class if available, otherwise fallback to simple parsing
        if (class_exists(\Locale::class)) {
            $primary = \Locale::getPrimaryLanguage($languageCode);
            return $primary ?? $languageCode;
        }

        // Fallback: split by '-' or '_' and take the first part
        $delimiterPos = strpos($languageCode, '-');

        if ($delimiterPos === false) {
            $delimiterPos = strpos($languageCode, '_');
        }

        if ($delimiterPos !== false) {
            return strtolower(substr($languageCode, 0, $delimiterPos));
        }

        return strtolower($languageCode);
    }
}
