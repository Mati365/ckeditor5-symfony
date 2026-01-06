<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorEditableRuntime;

class CKEditorEditableRuntimeTest extends TestCase
{
    public function testRender(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorEditableRuntime($twig);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_editable.html.twig', $this->callback(function ($parameters) {
                return isset($parameters['id']) && str_starts_with($parameters['id'], 'cke5-editable-');
            }))
            ->willReturn('html content');

        $result = $runtime->render();

        $this->assertEquals('html content', $result);
    }

    public function testRenderWithParameters(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorEditableRuntime($twig);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_editable.html.twig', $this->callback(function ($parameters) {
                return $parameters['id'] === 'my-id' && str_contains($parameters['style'], 'color: red');
            }))
            ->willReturn('html content');

        $result = $runtime->render(id: 'my-id', style: 'color: red');
        $this->assertEquals('html content', $result);
    }
}
