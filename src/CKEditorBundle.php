<?php

namespace Mati365\CKEditor5Symfony;

use Override;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\DependencyInjection\Extension\ExtensionInterface;
use Mati365\CKEditor5Symfony\DependencyInjection\CKEditorExtension;

/**
 * CKEditor 5 Symfony Bundle.
 */
final class CKEditorBundle extends Bundle
{
    #[\Override]
    public function getPath(): string
    {
        return dirname(__DIR__);
    }

    #[\Override]
    public function getContainerExtension(): ?ExtensionInterface
    {
        if (null === $this->extension) {
            $this->extension = new CKEditorExtension();
        }

        return $this->extension;
    }
}
