<?php

namespace Mati365\CKEditor5Symfony\Command\Installer\Strategy;

use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

interface InstallerStrategyInterface
{
    /**
     * @param array $importmap Current map that we are modifying
     * @return array Modified map
     */
    public function configure(InputInterface $input, SymfonyStyle $io, array $importmap): array;
}
