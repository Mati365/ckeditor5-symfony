<?php

namespace Mati365\CKEditor5Symfony;

use Override;
use Symfony\Component\HttpKernel\Bundle\Bundle;

final class CKEditorBundle extends Bundle
{
    #[\Override]
    public function getPath(): string
    {
        return dirname(__DIR__);
    }
}
