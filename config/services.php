<?php

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Mati365\CKEditor5Symfony\ConfigParser;

return static function (ContainerConfigurator $container): void {
    $container
      ->services()
      ->set('ckeditor5.config', ConfigParser::class);
};
