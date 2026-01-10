<?php

namespace Mati365\CKEditor5Symfony\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputInterface, InputOption};
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\TaggedIterator;
use Symfony\Component\Process\Process;
use Mati365\CKEditor5Symfony\Command\Installer\{ComposerManipulator, ImportmapManipulator, JSManipulator};
use Mati365\CKEditor5Symfony\Command\Installer\Strategy\InstallerStrategyInterface;

#[AsCommand(
    name: 'ckeditor5:assets-mapper:install',
    description: 'Configure CKEditor5 assets in importmap.php, update base template, and download CKEditor to assets/vendor for cloud or NPM distribution',
)]
final class CKEditor5AssetsMapperInstallCommand extends Command
{
    /**
     * @psalm-suppress UndefinedAttributeClass
     * @param iterable<InstallerStrategyInterface> $strategies
     */
    public function __construct(
        private ImportmapManipulator $importmapManipulator,
        private ComposerManipulator $composerManipulator,
        private JSManipulator $jsManipulator,
        #[TaggedIterator('mati365.ckeditor5.installer_strategy')]
        private iterable $strategies
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this
            ->addOption('distribution', null, InputOption::VALUE_REQUIRED, 'Distribution type: cloud or npm', 'npm')
            ->addOption('importmap-path', null, InputOption::VALUE_REQUIRED, 'Path to importmap.php file', 'importmap.php')
            ->addOption('editor-version', null, InputOption::VALUE_REQUIRED, 'CKEditor version', '47.3.0')
            ->addOption('translations', null, InputOption::VALUE_REQUIRED, 'Comma-separated list of translations', 'en')
            ->addOption('template-path', null, InputOption::VALUE_REQUIRED, 'Path to base template file', 'templates/base.html.twig')
            ->addOption('js-path', null, InputOption::VALUE_REQUIRED, 'Path to main JS file', 'assets/app.js')
            ->addOption('ckbox-version', null, InputOption::VALUE_OPTIONAL, 'CKBox version')
            ->addOption('ckbox-theme', null, InputOption::VALUE_OPTIONAL, 'CKBox theme (light or dark)')
            ->addOption('premium', null, InputOption::VALUE_NONE, 'Include premium features')
            ->addOption('skip-template-update', null, InputOption::VALUE_NONE, 'Skip updating the Twig template')
            ->addOption('skip-composer-update', null, InputOption::VALUE_NONE, 'Skip updating composer.json')
            ->addOption('skip-css-update', null, InputOption::VALUE_NONE, 'Skip updating CSS imports')
            ->addOption('skip-js-update', null, InputOption::VALUE_NONE, 'Skip updating Jng composer.json')
            ->addOption('skip-css-update', null, InputOption::VALUE_NONE, 'Skip updating CSS imports');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $distribution = $input->getOption('distribution');
        $importmapPath = $input->getOption('importmap-path');

        try {
            // 1. Select Strategy
            $strategy = $this->getStrategy($distribution);

            // 2. Prepare importmap data
            $importmap = $this->importmapManipulator->getImportmapData($importmapPath);
            $importmap = self::removeExistingCKEditorKeys($importmap);

            // Base configuration required for the bundle
            $importmap['@mati365/ckeditor5-symfony'] = [
                'path' => '@mati365/ckeditor5-symfony/index.mjs',
            ];

            // 3. Configure via Strategy
            $io->info("Configuring CKEditor5 importmap using '$distribution' strategy...");
            $importmap = $strategy->configureImportmap($input, $io, $importmap);

            $this->importmapManipulator->saveImportmap($importmapPath, $importmap);

            // 4. Update Twig and CSS
            $strategy->updateTwig($input, $io);

            if (!$input->getOption('skip-js-update')) {
                $jsPath = $input->getOption('js-path');
                $io->note("Adding import to JS file: $jsPath");
                $this->jsManipulator->addImport($jsPath, '@mati365/ckeditor5-symfony');
            }

            // 5.  Compile asset map
            $io->note('Compiling asset map...');
            $process = new Process([PHP_BINARY, 'bin/console', 'asset-map:compile']);
            $process->run();

            if (!$process->isSuccessful()) {
                $io->error('Failed to compile asset map: ' . $process->getErrorOutput());
                return Command::FAILURE;
            }

            // 6. Update composer.json
            if (!$input->getOption('skip-composer-update')) {
                $io->note("Updating composer.json auto-scripts...");
                $command = self::reconstructCommand($input);

                $this->composerManipulator
                    ->removeCommandsBySubstring('ckeditor5:importmap:install')
                    ->addCommandToAutoScripts($command);
            }

            $io->success("CKEditor5 assets configured successfully.");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $io->error($e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Selects the appropriate installer strategy based on distribution type.
     */
    private function getStrategy(string $type): InstallerStrategyInterface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($type)) {
                return $strategy;
            }
        }

        throw new \InvalidArgumentException(sprintf('Invalid distribution type "%s". Available strategies: %s', $type, /* logic to list types */ 'cloud, npm'));
    }

    /**
     * Removes existing CKEditor-related keys from the importmap.
     *
     * @param array $importmap
     * @return array
     */
    private static function removeExistingCKEditorKeys(array $importmap): array
    {
        return array_filter($importmap, fn($key) => !str_starts_with((string) $key, 'ckeditor5'), ARRAY_FILTER_USE_KEY);
    }

    /**
     * Reconstructs the command string with options for composer auto-scripts.
     */
    private static function reconstructCommand(InputInterface $input): string
    {
        $command = 'ckeditor5:importmap:install';
        $options = [];

        // Explicitly map strictly required options to ensure reproducibility
        // Instead of dynamic loops, explicit mapping is often safer for auto-scripts
        $options['--distribution'] = $input->getOption('distribution');
        $options['--editor-version'] = $input->getOption('editor-version');
        $options['--translations'] = $input->getOption('translations');

        // Add optional flags
        if ($input->getOption('premium')) {
            $options['--premium'] = null;
        }

        // Always add these for the auto-script version to prevent recursion/loops
        $options['--skip-template-update'] = null;
        $options['--skip-composer-update'] = null;
        $options['--skip-css-update'] = null;
        $options['--skip-js-update'] = null;

        // Build string
        $parts = [$command];
        foreach ($options as $name => $value) {
            if ($value === null) {
                $parts[] = $name;
            } else {
                $parts[] = sprintf('%s=%s', $name, $value);
            }
        }

        return implode(' ', $parts);
    }
}
