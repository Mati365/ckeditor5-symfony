<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Manipulates Twig templates to include CKEditor5 assets.
 */
class TwigManipulator
{
    private const SNIPPET_MARKER = 'ckeditor5_assets';

    public function __construct(
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    public function addAssetsToTemplate(string $templatePath = 'templates/base.html.twig'): void
    {
        $fullPath = $this->projectDir . '/' . $templatePath;

        if (!$this->filesystem->exists($fullPath)) {
            return;
        }

        $content = (string) file_get_contents($fullPath);

        // 1. Remove old snippets (cleanup)
        $content = $this->removeOldSnippet($content);

        // 2. Insert new content in the best position
        $newContent = $this->insertContentInBestPosition($content);

        if ($content !== $newContent) {
            $this->filesystem->dumpFile($fullPath, $newContent);
        }
    }

    /**
     * Returns a clean snippet without external indentation.
     * Internal indentation (for cke5_assets input) is fixed (4 spaces),
     * but the entire block will be shifted dynamically later.
     */
    private function getRawSnippet(): string
    {
        return implode("\n", [
            "{% block ckeditor5_assets %}",
            "    {{ cke5_assets() }}",
            "{% endblock %}\n",
        ]);
    }

    private function removeOldSnippet(string $content): string
    {
        // Removes the block with surroundings (possible empty lines after removal)
        $patternBlock = '/(\s*){% block ' . self::SNIPPET_MARKER . ' %}.*?{% endblock %}(\s*)/s';

        // Check if there's anything to remove at all, to avoid unnecessarily breaking formatting
        if (preg_match($patternBlock, $content)) {
            $content = (string) preg_replace($patternBlock, '', $content);
        }

        // Removes the function itself if it was loose
        return (string) preg_replace('/\s*{{ cke5_assets\(\) }}/', '', $content);
    }

    private function insertContentInBestPosition(string $content): string
    {
        $snippet = $this->getRawSnippet();

        // --- STRATEGY 1: After the 'importmap' block ---
        // We look for the beginning of the importmap block to get its indentation
        if (preg_match('/^([ \t]*){% block importmap %}/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0]; // These are spaces/tabs before {% block ...

            // We look for the end of this block (nearest endblock)
            // Note: This is a simplification, assumes no nested blocks inside importmap
            if (preg_match('/{% endblock %}/', $content, $endMatches, PREG_OFFSET_CAPTURE, $matches[0][1])) {
                $endBlockPos = $endMatches[0][1] + strlen($endMatches[0][0]);

                // We insert: 2 newlines + indented snippet
                $toInsert = "\n\n" . $this->indentSnippet($snippet, $indentation);

                return substr_replace($content, $toInsert, $endBlockPos, 0);
            }
        }

        // --- STRATEGY 2: After the importmap() function (without block) ---
        if (preg_match('/^([ \t]*){{ importmap/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0];

            // We find the end of this line/tag
            $endPos = strpos($content, '}}', $matches[0][1]);
            if ($endPos !== false) {
                $endPos += 2; // we move past }}

                $toInsert = "\n\n" . $this->indentSnippet($snippet, $indentation);
                return substr_replace($content, $toInsert, $endPos, 0);
            }
        }

        // --- STRATEGY 3: Before </head> ---
        if (preg_match('/^([ \t]*)<\/head>/m', $content, $matches, PREG_OFFSET_CAPTURE)) {
            $indentation = $matches[1][0]; // We take the indentation of the </head> tag (usually correct for its children + 1 level, but here we'll take the same or +4 spaces)

            // Optionally: Let's add one more indentation than </head> has, because we're inserting INSIDE head
            $indentation .= '    ';

            $insertPos = $matches[0][1]; // Beginning of the line with </head>

            // We insert before </head>
            $toInsert = $this->indentSnippet($snippet, $indentation) . "\n";
            return substr_replace($content, $toInsert, $insertPos, 0);
        }

        // --- FALLBACK: End of file ---
        return $content . "\n" . $snippet;
    }

    /**
     * Adds the specified indentation to each line of the snippet
     */
    private function indentSnippet(string $snippet, string $indentation): string
    {
        $lines = explode("\n", $snippet);
        $indentedLines = array_map(function ($line) use ($indentation) {
            return $indentation . $line;
        }, $lines);

        return implode("\n", $indentedLines);
    }
}
