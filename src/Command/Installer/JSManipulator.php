<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Manipulates JS files to include or remove imports.
 */
final class JSManipulator
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
     * Adds an import to the JS file if it doesn't already exist.
     * Uses syntax: import 'package-name';
     *
     * @param string $jsPath     Relative path to the JS file (e.g. 'assets/app.js')
     * @param string $importName The package/module to import (e.g. '@mati365/ckeditor5-symfony')
     */
    public function addImport(string $jsPath, string $importName): void
    {
        $fullPath = $this->projectDir . '/' . $jsPath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);

        if (self::hasImport($content, $importName)) {
            return;
        }

        // Generate import line: import 'package-name';
        $importLine = sprintf("import '%s';", $importName);

        // Insert at the top (but after 'use strict' if present)
        $newContent = self::prependContent($content, $importLine);

        if ($content !== $newContent) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Removes an import based on the package name.
     * Handles both single and double quotes.
     *
     * @param string $jsPath     Relative path to the JS file
     * @param string $importName The package/module to remove
     */
    public function removeImport(string $jsPath, string $importName): void
    {
        $fullPath = $this->projectDir . '/' . $jsPath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);
        $pattern = self::createRemovalPattern($importName);

        /** @psalm-suppress ArgumentTypeCoercion */
        $newContent = preg_replace($pattern, '', $content);

        if ($content !== $newContent && $newContent !== null) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Checks if the content already contains the import.
     *
     * @param string $content    The JS file content
     * @param string $importName The import name to search for
     * @return bool True if the import exists, false otherwise
     */
    private static function hasImport(string $content, string $importName): bool
    {
        // Simple check, can be improved to be usage aware, but for now str_contains is enough for simple imports
        // checking for "import 'name'" or 'import "name"' would be more precise
        return preg_match(sprintf('/import\s+[\'"]%s[\'"]/', preg_quote($importName, '/')), $content) === 1;
    }

    /**
     * Prepends a line to the content, respecting 'use strict' declaration.
     *
     * @param string $content The JS file content
     * @param string $line    The line to insert
     * @return string The modified content
     */
    private static function prependContent(string $content, string $line): string
    {
        // Check for 'use strict' at the beginning
        if (preg_match('/^[\'"]use strict[\'"];\s*/i', $content, $matches)) {
            $useStrict = $matches[0];
            $rest = substr($content, strlen($useStrict));

            return rtrim($useStrict) . "\n" . $line . "\n" . ltrim($rest);
        }

        return $line . "\n" . $content;
    }

    /**
     * Creates a regex pattern to match the import line.
     * Matches: import 'name'; OR import "name";
     *
     * @param string $importName The name to match
     * @return string The regex pattern
     */
    private static function createRemovalPattern(string $importName): string
    {
        $escapedName = preg_quote($importName, '/');

        // Pattern explanation:
        // /import\s+           -> Match import followed by whitespace
        // ['"]                 -> Match opening quote
        // NAME                 -> The escaped name
        // ['"]                 -> Match closing quote
        // \s*;\s*              -> Match semicolon with optional spaces
        // (\R)?/               -> Match optional line break
        return sprintf('/import\s+[\'"]%s[\'"]\s*;\s*(\R)?/', $escapedName);
    }
}
