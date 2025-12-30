<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Generic manipulator for Twig templates to add or remove blocks.
 */
class TwigManipulator
{
    public function __construct(
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    /**
     * Adds a generic block to the template if it doesn't exist.
     */
    public function addBlock(string $templatePath, string $blockName, string $blockContent): void
    {
        $fullPath = $this->projectDir . '/' . $templatePath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);

        // Check if block is already present to avoid duplicates
        // We search for the block definition: {% block NAME %}
        if (preg_match(sprintf('/{%% block %s %%}/', preg_quote($blockName, '/')), $content)) {
            return;
        }

        // Create the full snippet
        $snippet = self::createBlockSnippet($blockName, $blockContent);

        // Insert new content in the best position
        $newContent = self::insertContentInBestPosition($content, $snippet);

        if ($content !== $newContent) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Removes a block by its name.
     */
    public function removeBlock(string $templatePath, string $blockName): void
    {
        $fullPath = $this->projectDir . '/' . $templatePath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);

        // Regex to match {% block NAME %} ... {% endblock %}
        // Handles multiline content and surrounding whitespace cleanup
        $pattern = sprintf(
            '/(\R+)?\s*{%% block %s %%}.*?{%% endblock %%}(\R+)?/s',
            preg_quote($blockName, '/')
        );

        $newContent = preg_replace($pattern, '', $content);

        if ($content !== $newContent && $newContent !== null) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Wraps content in block tags and applies internal indentation.
     */
    private static function createBlockSnippet(string $name, string $content): string
    {
        return implode("\n", [
            sprintf("{%% block %s %%}", $name),
            "    " . $content, // Default 4-space indent for inner content
            "{% endblock %}",
        ]);
    }

    /**
     * Inserts the snippet into the content in the best position.
     */
    private static function insertContentInBestPosition(string $content, string $snippet): string
    {
        // --- STRATEGY 1: After the 'importmap' block ---
        if (preg_match('/^([ \t]*){% block importmap %}/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0];
            if (preg_match('/{% endblock %}/', $content, $endMatches, PREG_OFFSET_CAPTURE, $matches[0][1])) {
                $endBlockPos = $endMatches[0][1] + strlen($endMatches[0][0]);
                $toInsert = "\n\n" . self::indentSnippet($snippet, $indentation);

                return substr_replace($content, $toInsert, $endBlockPos, 0);
            }
        }

        // --- STRATEGY 2: After the importmap() function (without block) ---
        if (preg_match('/^([ \t]*){{ importmap/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0];
            $endPos = strpos($content, '}}', $matches[0][1]);
            if ($endPos !== false) {
                $endPos += 2;
                $toInsert = "\n\n" . self::indentSnippet($snippet, $indentation);

                return substr_replace($content, $toInsert, $endPos, 0);
            }
        }

        // --- STRATEGY 3: Before </head> ---
        if (preg_match('/^([ \t]*)<\/head>/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0] . '    ';
            $insertPos = $matches[0][1];
            $toInsert = self::indentSnippet($snippet, $indentation) . "\n";

            return substr_replace($content, $toInsert, $insertPos, 0);
        }

        // --- FALLBACK: End of file ---
        return $content . "\n" . $snippet;
    }

    /**
     * Indents each line of the snippet with the given indentation.
     */
    private static function indentSnippet(string $snippet, string $indentation): string
    {
        $lines = explode("\n", $snippet);
        $indentedLines = array_map(function ($line) use ($indentation) {
            return $indentation . $line;
        }, $lines);

        return implode("\n", $indentedLines);
    }
}
