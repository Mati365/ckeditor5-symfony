<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;

/**
 * Manipulates composer.json to add or remove commands to auto-scripts.
 */
class ComposerManipulator
{
    public function __construct(
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    /**
     * Removes all commands from auto-scripts that contain the given substring.
     */
    public function removeCommandsBySubstring(string $substring, string $composerPath = 'composer.json'): self
    {
        $fullPath = $this->projectDir . '/' . $composerPath;
        $fileData = $this->loadComposerData($fullPath);

        if (null === $fileData) {
            return $this;
        }

        [$data, $indentStyle] = $fileData;

        if (!isset($data['scripts']['auto-scripts']) || !is_array($data['scripts']['auto-scripts'])) {
            return $this;
        }

        /** @var array<string, string> $autoScripts */
        $autoScripts = $data['scripts']['auto-scripts'];
        $originalCount = count($autoScripts);

        // Filter out keys containing the substring
        $autoScripts = array_filter(
            $autoScripts,
            fn(string $key) => !str_contains($key, $substring),
            ARRAY_FILTER_USE_KEY
        );

        if (count($autoScripts) === $originalCount) {
            return $this;
        }

        $data['scripts']['auto-scripts'] = $autoScripts;
        $this->saveComposerData($fullPath, $data, $indentStyle);
        return $this;
    }

    /**
     * Adds a command to auto-scripts if it does not already exist.
     */
    public function addCommandToAutoScripts(string $command, string $composerPath = 'composer.json'): self
    {
        $fullPath = $this->projectDir . '/' . $composerPath;
        $fileData = $this->loadComposerData($fullPath);

        if (null === $fileData) {
            return $this;
        }

        [$data, $indentStyle] = $fileData;

        if (!isset($data['scripts']) || !is_array($data['scripts'])) {
            $data['scripts'] = [];
        }

        if (!isset($data['scripts']['auto-scripts']) || !is_array($data['scripts']['auto-scripts'])) {
            $data['scripts']['auto-scripts'] = [];
        }

        /** @var array<string, string> $autoScripts */
        $autoScripts = $data['scripts']['auto-scripts'];

        if (array_key_exists($command, $autoScripts)) {
            return $this;
        }

        $keys = array_keys($autoScripts);
        $position = array_search('importmap:install', $keys);

        if ($position === false) {
            $autoScripts[$command] = 'symfony-cmd';
        } else {
            $autoScripts = array_slice($autoScripts, 0, $position + 1, true)
                           + [$command => 'symfony-cmd']
                           + array_slice($autoScripts, $position + 1, null, true);
        }

        $data['scripts']['auto-scripts'] = $autoScripts;
        $this->saveComposerData($fullPath, $data, $indentStyle);
        return $this;
    }

    /**
     * @return array{0: array<string, mixed>, 1: string}|null
     */
    private function loadComposerData(string $fullPath): ?array
    {
        if (!$this->filesystem->exists($fullPath)) {
            return null;
        }

        $content = (string) file_get_contents($fullPath);

        $indentStyle = '    ';
        if (preg_match('/^(\s+)"/m', $content, $matches)) {
            $indentStyle = $matches[1];
        }

        /** @var array<string, mixed>|null $data */
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            return null;
        }

        return [$data, $indentStyle];
    }

    /**
     * Saves the modified composer.json data back to the file.
     */
    private function saveComposerData(string $fullPath, array $data, string $indentStyle): void
    {
        $newContent = (string) json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        if ($indentStyle !== '    ') {
            $newContent = self::reformatJson($newContent, $indentStyle);
        }

        $newContent .= "\n";
        $this->filesystem->dumpFile($fullPath, $newContent);
    }

    /**
     * Reformats JSON string to use the specified indentation style.
     */
    private static function reformatJson(string $json, string $targetIndent): string
    {
        return (string) preg_replace_callback(
            '/^( {4,})/m',
            function ($matches) use ($targetIndent) {
                $level = strlen($matches[1]) / 4;
                return str_repeat($targetIndent, (int) $level);
            },
            $json
        );
    }
}
