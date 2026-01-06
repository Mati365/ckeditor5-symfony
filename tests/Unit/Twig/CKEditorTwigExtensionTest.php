<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig;

use Mati365\CKEditor5Symfony\Twig\CKEditorTwigExtension;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorRuntime;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorCloudAssetsRuntime;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorHiddenInputRuntime;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorContextRuntime;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorEditableRuntime;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorUIPartRuntime;
use PHPUnit\Framework\TestCase;
use Twig\TwigFunction;

class CKEditorTwigExtensionTest extends TestCase
{
    public function testGetFunctions(): void
    {
        $extension = new CKEditorTwigExtension();
        $functions = $extension->getFunctions();

        $this->assertCount(6, $functions);
        $this->assertContainsOnlyInstancesOf(TwigFunction::class, $functions);

        $functionsMap = [];
        foreach ($functions as $function) {
            $functionsMap[$function->getName()] = $function->getCallable();
        }

        $this->assertArrayHasKey('cke5_editor', $functionsMap);
        $this->assertEquals([CKEditorRuntime::class, 'render'], $functionsMap['cke5_editor']);

        $this->assertArrayHasKey('cke5_cloud_assets', $functionsMap);
        $this->assertEquals([CKEditorCloudAssetsRuntime::class, 'render'], $functionsMap['cke5_cloud_assets']);

        $this->assertArrayHasKey('cke5_hidden_input', $functionsMap);
        $this->assertEquals([CKEditorHiddenInputRuntime::class, 'render'], $functionsMap['cke5_hidden_input']);

        $this->assertArrayHasKey('cke5_context', $functionsMap);
        $this->assertEquals([CKEditorContextRuntime::class, 'render'], $functionsMap['cke5_context']);

        $this->assertArrayHasKey('cke5_editable', $functionsMap);
        $this->assertEquals([CKEditorEditableRuntime::class, 'render'], $functionsMap['cke5_editable']);

        $this->assertArrayHasKey('cke5_ui_part', $functionsMap);
        $this->assertEquals([CKEditorUIPartRuntime::class, 'render'], $functionsMap['cke5_ui_part']);
    }
}
