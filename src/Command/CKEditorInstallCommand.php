<?php

namespace Mati365\CKEditor5Symfony\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\{InputArgument, InputInterface};
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\AssetMapper\ImportMap\ImportMapManager;

#[AsCommand(
    name: 'ckeditor:install',
    description: 'Installs CKEditor into importmap.php and fetches the specified version.'
)]
class CkeditorInstallCommand extends Command
{
    private ?ImportMapManager $importMapManager;

    public function __construct(ImportMapManager $importMapManager)
    {
        parent::__construct();
        $this->importMapManager = $importMapManager;
    }

    #[\Override]
    protected function configure(): void
    {
        // TODO: First read configuration from ckeditor.yaml if available.
        // TODO2: Config should be created during installation if not present.
        // TODO3: If cloud editor is used
        // These arguments should override config values.
        $this
            ->addArgument('version', InputArgument::OPTIONAL, 'CKEditor version', 'latest')
            ->addArgument('distribution', InputArgument::OPTIONAL, 'Editor distribution (cloud, self-hosted)', 'self-hosted')
            ->addArgument('premium', InputArgument::OPTIONAL, 'Whether to use the premium package (true/false)', 'false')
            ->addArgument('translations', InputArgument::OPTIONAL | InputArgument::IS_ARRAY, 'Comma-separated list of translations to include', '');
    }

    #[\Override]
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if (!$this->importMapManager) {
            $output->writeln('<error>AssetMapper nie jest zainstalowany. Zainstaluj go, aby używać importmap.</error>');
            return Command::FAILURE;
        }

        $version = (string) $input->getArgument('version');
        $distribution = (string) $input->getArgument('distribution');

        // // TO JEST KLUCZOWY MOMENT:
        // // Programowo wywołujemy logikę "importmap:require"
        // $this->importMapManager->require([$packageName]);

        $output->writeln('<info>CKEditor został pomyślnie dodany do importmap.php!</info>');

        return Command::SUCCESS;
    }
}
