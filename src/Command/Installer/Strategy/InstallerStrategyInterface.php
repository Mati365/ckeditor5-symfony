<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

interface InstallerStrategyInterface
{
    /**
     * @param string $distribution
     * @return bool
     */
    public function supports(string $distribution): bool;

    /**
     * @param InputInterface $input The console input
     * @param SymfonyStyle $io The SymfonyStyle for console output
     * @param array $importmap Current map that we are modifying
     * @return array Modified map
     */
    public function configureImportmap(InputInterface $input, SymfonyStyle $io, array $importmap): array;

    /**
     * Updates the Twig template based on the strategy.
     *
     * @param InputInterface $input The console input
     * @param SymfonyStyle $io The SymfonyStyle for console output
     * @return void
     */
    public function updateTwig(InputInterface $input, SymfonyStyle $io): void;

    /**
     * Updates the CSS file based on the strategy.
     *
     * @param InputInterface $input The console input
     * @param SymfonyStyle $io The SymfonyStyle for console output
     * @return void
     */
    public function updateCss(InputInterface $input, SymfonyStyle $io): void;
}
