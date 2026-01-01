<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Manipulates CSS files to include or remove imports using string syntax.
 */
final class CSSManipulator
{
    /**
     * @param Filesystem $filesystem The Symfony filesystem component
     * @param string $projectDir The root directory of the project
     */
    public function __construct(
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    /**
     * Adds an @import rule to the CSS file if it doesn't already exist.
     * Uses string syntax: @import "../path/to/file.css";
     *
     * @param string $cssPath   Relative path to the CSS file (e.g. 'assets/styles/app.css')
     * @param string $importUrl The URL/path to import (e.g. '../vendor/ckeditor5/dist/ckeditor5.css')
     */
    public function addImport(string $cssPath, string $importUrl): void
    {
        $fullPath = $this->projectDir . '/' . $cssPath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);

        if (self::hasImport($content, $importUrl)) {
            return;
        }

        // Generate line without url(): @import "path/to/file.css";
        $importLine = sprintf('@import "%s";', $importUrl);

        // Insert at the top (but after @charset if present)
        $newContent = self::prependContent($content, $importLine);

        if ($content !== $newContent) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Removes an @import rule based on the URL.
     * Handles both single and double quotes, with or without url() wrapper.
     *
     * @param string $cssPath   Relative path to the CSS file
     * @param string $importUrl The URL/path to remove
     */
    public function removeImport(string $cssPath, string $importUrl): void
    {
        $fullPath = $this->projectDir . '/' . $cssPath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);
        $pattern = self::createRemovalPattern($importUrl);

        /** @psalm-suppress ArgumentTypeCoercion */
        $newContent = preg_replace($pattern, '', $content);

        if ($content !== $newContent && $newContent !== null) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Checks if the content already contains the import URL.
     *
     * @param string $content The CSS file content
     * @param string $url     The import URL to search for
     * @return bool True if the import exists, false otherwise
     */
    private static function hasImport(string $content, string $url): bool
    {
        return str_contains($content, $url);
    }

    /**
     * Prepends a line to the content, respecting the @charset declaration.
     * If @charset exists, the new line is inserted after it.
     *
     * @param string $content The CSS file content
     * @param string $line    The line to insert
     * @return string The modified content
     */
    private static function prependContent(string $content, string $line): string
    {
        // Check for @charset at the very beginning (case-insensitive)
        if (preg_match('/^@charset\s+["\'][^"\']+["\'];\s*/i', $content, $matches)) {
            $charset = $matches[0];
            $rest = substr($content, strlen($charset));

            // Reconstruct: Charset + NewLine + Import + NewLine + Rest
            return rtrim($charset) . "\n" . $line . "\n" . ltrim($rest);
        }

        return $line . "\n" . $content;
    }

    /**
     * Creates a regex pattern to match the import line.
     * Matches: @import "url"; OR @import 'url'; OR @import url("url");
     *
     * @param string $url The URL to match
     * @return string The regex pattern
     */
    private static function createRemovalPattern(string $url): string
    {
        $escapedUrl = preg_quote($url, '/');

        // Pattern explanation:
        // /@import\s+          -> Match @import followed by whitespace
        // (?:url\(\s*)?        -> Optional 'url(' start (non-capturing)
        // ['"]                 -> Match opening quote (' or ")
        // URL                  -> The escaped URL
        // ['"]                 -> Match closing quote
        // (?:\s*\))?           -> Optional ')' end (non-capturing)
        // \s*;\s* -> Match semicolon with optional spaces
        // (\R)?/               -> Match optional line break at the end
        return sprintf('/@import\s+(?:url\(\s*)?[\'"]%s[\'"](?:\s*\))?\s*;\s*(\R)?/', $escapedUrl);
    }
}
