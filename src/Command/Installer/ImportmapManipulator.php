<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\VarExporter\VarExporter;

/**
 * Manages reading and writing the importmap configuration file.
 */
final class ImportmapManipulator
{
    public function __construct(
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    /**
     * Loads the importmap data from the given path.
     */
    public function getImportmapData(string $path): array
    {
        $fullPath = $this->projectDir . '/' . $path;

        if (!$this->filesystem->exists($fullPath)) {
            throw new \RuntimeException("Importmap file not found at: $fullPath");
        }

        /** @psalm-suppress UnresolvableInclude */
        $data = require $fullPath;

        if (!is_array($data)) {
            throw new \RuntimeException("File $path must return an array.");
        }

        return $data;
    }

    /**
     * Saves the importmap data to the given path.
     */
    public function saveImportmap(string $path, array $data): void
    {
        $fullPath = $this->projectDir . '/' . $path;
        $exportedArray = VarExporter::export($data);

        $content = <<<PHP
            <?php

            /**
             * Returns the importmap for this application.
             *
             * - "path" is a path inside the asset mapper system. Use the
             *     "debug:asset-map" command to see the full list of paths.
             *
             * - "entrypoint" (JavaScript only) set to true for any module that will
             *     be used as an "entrypoint" (and passed to the importmap() Twig function).
             *
             * The "importmap:require" command can be used to add new entries to this file.
             */
            return $exportedArray;

            PHP;

        $this->filesystem->dumpFile($fullPath, $content);
    }
}
