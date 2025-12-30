<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Generic manipulator for Twig templates to add or remove blocks.
 * Uses smart whitespace detection to avoid messy formatting.
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

        // Check if block is already present
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
        // Handles multiline content and aggressively cleans surrounding empty lines
        $pattern = sprintf(
            '/(\R+)?\s*{%% block %s %%}.*?{%% endblock %%}(\R+)?/s',
            preg_quote($blockName, '/')
        );

        // Replacement ensures we don't leave a huge gap, but keep one newline
        $newContent = preg_replace($pattern, "\n", $content);

        // Optional: Clean up potential triple newlines created by removal if logic was imperfect
        $newContent = preg_replace("/\n{3,}/", "\n\n", (string) $newContent);

        if ($content !== $newContent && $newContent !== null) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Wraps content in block tags.
     */
    private static function createBlockSnippet(string $name, string $content): string
    {
        return implode("\n", [
            sprintf("{%% block %s %%}", $name),
            "    " . $content,
            "{% endblock %}",
        ]);
    }

    /**
     * Inserts the snippet into the content in the best position with smart whitespace handling.
     */
    private static function insertContentInBestPosition(string $content, string $snippet): string
    {
        // --- STRATEGY 1: After the 'importmap' block ---
        if (preg_match('/^([ \t]*){% block importmap %}/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0];

            // Find the end of the block
            if (preg_match('/{% endblock %}/', $content, $endMatches, PREG_OFFSET_CAPTURE, $matches[0][1])) {
                $endBlockPos = $endMatches[0][1] + strlen($endMatches[0][0]);

                // We want 2 newlines before (to create an empty line gap) and at least 1 after
                return self::smartInsert($content, $snippet, $endBlockPos, $indentation, 2, 1);
            }
        }

        // --- STRATEGY 2: After the importmap() function (without block) ---
        if (preg_match('/^([ \t]*){{ importmap/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0];
            $endPos = strpos($content, '}}', $matches[0][1]);
            if ($endPos !== false) {
                $endPos += 2;

                // We want 2 newlines before (gap) and 1 after
                return self::smartInsert($content, $snippet, $endPos, $indentation, 2, 1);
            }
        }

        // --- STRATEGY 3: Before </head> ---
        if (preg_match('/^([ \t]*)<\/head>/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0] . '    '; // Indent one level deeper than </head>
            $insertPos = $matches[0][1];

            // Inside head, we usually just want it on a new line, no huge gap needed.
            // 1 newline before (to break from previous tag), 1 newline after (to push </head> down)
            return self::smartInsert($content, $snippet, $insertPos, $indentation, 1, 1);
        }

        // --- FALLBACK: End of file ---
        // Just append with a newline
        return rtrim($content) . "\n\n" . $snippet . "\n";
    }

    /**
     * Indents the snippet and inserts it intelligently handling surrounding newlines.
     * * @param string $content Full file content
     * @param string $snippet The code to insert
     * @param int $position Insertion index
     * @param string $indentation String to use for indentation (e.g. 4 spaces)
     * @param int $targetNewlinesBefore How many newlines do we want before the snippet? (1 = next line, 2 = empty line in between)
     * @param int $targetNewlinesAfter How many newlines do we want after the snippet?
     */
    private static function smartInsert(
        string $content,
        string $snippet,
        int $position,
        string $indentation,
        int $targetNewlinesBefore = 1,
        int $targetNewlinesAfter = 1
    ): string {
        // 1. Analyze what is BEFORE the cursor
        $textBefore = substr($content, 0, $position);
        $existingNewlinesBefore = 0;
        if (preg_match('/(\R+)[ \t]*$/', $textBefore, $matches)) {
            // Count distinct line breaks in the captured group
            $existingNewlinesBefore = substr_count($matches[1], "\n");
        }

        // 2. Analyze what is AFTER the cursor
        $textAfter = substr($content, $position);
        $existingNewlinesAfter = 0;
        if (preg_match('/^([ \t]*\R+)/', $textAfter, $matches)) {
            $existingNewlinesAfter = substr_count($matches[1], "\n");
        }

        // 3. Calculate missing newlines
        $neededBefore = max(0, $targetNewlinesBefore - $existingNewlinesBefore);
        $neededAfter = max(0, $targetNewlinesAfter - $existingNewlinesAfter);

        // 4. Prepare the indented snippet
        $indentedSnippet = self::indentSnippet($snippet, $indentation);

        // 5. Construct the insertion string
        // Note: We don't indent the "before" newlines, as they are just vertical spacing.
        // The indentation is applied to the snippet lines themselves.
        $insertion = str_repeat("\n", $neededBefore) . $indentedSnippet . str_repeat("\n", $neededAfter);

        return substr_replace($content, $insertion, $position, 0);
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
