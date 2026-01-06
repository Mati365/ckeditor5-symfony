<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorHiddenInputRuntime;

class CKEditorHiddenInputRuntimeTest extends TestCase
{
    public function testRender(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorHiddenInputRuntime($twig);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_hidden_input.html.twig', $this->callback(function ($parameters) {
                return isset($parameters['id']) && str_starts_with($parameters['id'], 'cke5-input-');
            }))
            ->willReturn('html content');

        $result = $runtime->render();
        $this->assertEquals('html content', $result);
    }

    public function testRenderWithParameters(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorHiddenInputRuntime($twig);

        $twig->expects($this->once())
           ->method('render')
           ->with('@CKEditor5/cke5_hidden_input.html.twig', $this->callback(function ($parameters) {
               return $parameters['id'] === 'my-input' && $parameters['style'] === 'display: none;';
           }))
            ->willReturn('html content');

        $result = $runtime->render(id: 'my-input', style: 'display: none;');
        $this->assertEquals('html content', $result);
    }
}
