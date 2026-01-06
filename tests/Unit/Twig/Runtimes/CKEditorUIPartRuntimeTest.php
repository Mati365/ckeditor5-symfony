<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorUIPartRuntime;

class CKEditorUIPartRuntimeTest extends TestCase
{
    public function testRender(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorUIPartRuntime($twig);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_ui_part.html.twig', $this->callback(function ($parameters) {
                return isset($parameters['id']) && str_starts_with($parameters['id'], 'cke5-ui-part-')
                    && $parameters['name'] === 'toolbar';
            }))
            ->willReturn('html content');

        $result = $runtime->render(name: 'toolbar');
        $this->assertEquals('html content', $result);
    }

    public function testRenderWithParameters(): void
    {
        $twig = $this->createMock(Environment::class);
        $runtime = new CKEditorUIPartRuntime($twig);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_ui_part.html.twig', $this->callback(function ($parameters) {
                return $parameters['id'] === 'my-part' && $parameters['name'] === 'menubar';
            }))
            ->willReturn('html content');

        $result = $runtime->render(name: 'menubar', id: 'my-part');
        $this->assertEquals('html content', $result);
    }
}
