<?php

namespace Mati365\CKEditor5Symfony\Command\Installer;

use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Handles downloading and extracting NPM packages.
 */
final class NpmPackageInstaller
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private Filesystem $filesystem,
        private string $projectDir
    ) {}

    /**
     * Downloads and extracts an NPM package to the assets/vendor directory.
     */
    public function downloadAndExtract(string $package, string $version): void
    {
        $tarballUrl = "https://registry.npmjs.org/$package/-/$package-$version.tgz";
        $tempFile = sys_get_temp_dir() . "/$package-$version.tgz";
        $targetVendorDir = $this->projectDir . "/assets/vendor/$package";

        // 1. Downloading
        $response = $this->httpClient->request('GET', $tarballUrl);
        $this->filesystem->dumpFile($tempFile, $response->getContent());

        // 2. Unpacking
        $phar = new \PharData($tempFile);
        $phar->extractTo($targetVendorDir, null, true);

        // 3. Moving contents from the 'package' subdirectory one level up
        // NPM packages everything in the 'package' folder, we need to extract it
        $packageSubDir = "$targetVendorDir/package";

        if ($this->filesystem->exists($packageSubDir)) {
            $finder = new Finder();
            $finder->in($packageSubDir)->files(); // Get all files recursively

            foreach ($finder as $file) {
                $relativePath = $file->getRelativePathname();
                $this->filesystem->copy(
                    $file->getPathname(),
                    "$targetVendorDir/$relativePath",
                    true
                );
            }

            $this->filesystem->remove($packageSubDir);
        }

        // 4. Cleaning up
        $this->filesystem->remove($tempFile);
    }
}
