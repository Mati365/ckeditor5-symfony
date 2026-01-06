<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorContextRuntime;

class CKEditorContextRuntimeTest extends TestCase
{
    public function testRender(): void
    {
        $twig = $this->createMock(Environment::class);
        $config = [
            'contexts' => [
                'default' => [
                    'config' => [],
                ],
            ],
        ];

        $configManager = new ConfigManager($config);
        $runtime = new CKEditorContextRuntime($twig, $configManager);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_context.html.twig', $this->callback(function ($parameters) {
                return isset($parameters['id']) && str_starts_with($parameters['id'], 'cke5-context-')
                    && isset($parameters['context'])
                    && isset($parameters['language']);
            }))
            ->willReturn('html content');

        $result = $runtime->render();
        $this->assertEquals('html content', $result);
    }
}
