<?php

namespace Mati365\CKEditor5Symfony\Command;

use Mati365\CKEditor5Symfony\Command\Installer\{ImportmapManipulator, TwigManipulator};
use Mati365\CKEditor5Symfony\Command\Installer\Strategy\{CloudInstallerStrategy, NpmInstallerStrategy};
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputInterface, InputOption};
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Process\Process;

#[AsCommand(
    name: 'ckeditor5:importmap:configure',
    description: 'Configure CKEditor5 assets in importmap.php for cloud or NPM distribution',
)]
class ConfigureImportmapCommand extends Command
{
    public function __construct(
        private ImportmapManipulator $importmapManipulator,
        private CloudInstallerStrategy $cloudStrategy,
        private NpmInstallerStrategy $npmStrategy,
        private TwigManipulator $twigManipulator,
    ) {
        parent::__construct();
    }

    #[\Override]
    protected function configure(): void
    {
        $this
            ->addOption('distribution', null, InputOption::VALUE_REQUIRED, 'Distribution type: cloud or npm', 'cloud')
            ->addOption('importmap-path', null, InputOption::VALUE_REQUIRED, 'Path to importmap.php file', 'importmap.php')
            ->addOption('editor-version', null, InputOption::VALUE_REQUIRED, 'CKEditor version', '47.3.0')
            ->addOption('premium', null, InputOption::VALUE_NONE, 'Include premium features')
            ->addOption('ckbox-version', null, InputOption::VALUE_OPTIONAL, 'CKBox version for cloud distribution')
            ->addOption('translations', null, InputOption::VALUE_OPTIONAL, 'Comma-separated list of translations', 'en')
            ->addOption('skip-template-update', null, InputOption::VALUE_NONE, 'Skip updating the Twig template');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $distribution = $input->getOption('distribution');
        $importmapPath = $input->getOption('importmap-path');

        try {
            // 1. Retrieving current data from importmap.php
            $importmap = $this->importmapManipulator->getImportmapData($importmapPath);

            // Remove all keys starting with 'ckeditor5'
            $importmap = array_filter($importmap, function ($key) {
                return !str_starts_with((string) $key, 'ckeditor5');
            }, ARRAY_FILTER_USE_KEY);

            // 2. Base configuration of the PHP package (always needed for runtime)
            $importmap['@mati365/ckeditor5-symfony'] = [
                'path' => '@mati365/ckeditor5-symfony/index.mjs',
            ];

            // 3. Selection and execution of strategy
            $strategy = match ($distribution) {
                'cloud' => $this->cloudStrategy,
                'npm'   => $this->npmStrategy,
                default => throw new \InvalidArgumentException("Invalid distribution type: $distribution")
            };

            // 4. Saving the modified map
            $io->info("Configuring CKEditor5 importmap...");
            $importmap = $strategy->configure($input, $io, $importmap);
            $this->importmapManipulator->saveImportmap($importmapPath, $importmap);

            // 5. Modifying Twig template to include assets (optional)
            $skipTemplate = $input->getOption('skip-template-update');
            if (!$skipTemplate) {
                $io->note('Configuring base.html.twig...');
                $this->twigManipulator->addAssetsToTemplate();
            }

            // 6. Compile asset map
            $io->note('Compiling asset map...');
            $process = new Process(['php', 'bin/console', 'asset-map:compile']);
            $process->run();

            if (!$process->isSuccessful()) {
                $io->error('Failed to compile asset map: ' . $process->getErrorOutput());
                return Command::FAILURE;
            }

            $io->success("CKEditor5 assets configured successfully via $distribution.");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $io->error($e->getMessage());
            return Command::FAILURE;
        }
    }
}
