<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Twig\Runtimes;

use PHPUnit\Framework\TestCase;
use Twig\Environment;
use Mati365\CKEditor5Symfony\Service\ConfigManager;
use Mati365\CKEditor5Symfony\Twig\Runtimes\CKEditorRuntime;

class CKEditorRuntimeTest extends TestCase
{
    public function testRender(): void
    {
        $twig = $this->createMock(Environment::class);
        $config = [
            'presets' => [
                'default' => [
                    'editorType' => 'classic',
                    'config' => [],
                ],
            ],
        ];

        $configManager = new ConfigManager($config);
        $runtime = new CKEditorRuntime($twig, $configManager);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_editor.html.twig', $this->callback(function ($parameters) {
                return isset($parameters['id']) && str_starts_with($parameters['id'], 'cke5-')
                    && isset($parameters['preset'])
                    && isset($parameters['content'])
                    && $parameters['watchdog'] === true;
            }))
            ->willReturn('html content');

        $result = $runtime->render();
        $this->assertEquals('html content', $result);
    }

    public function testRenderWithParameterOverrides(): void
    {
        $twig = $this->createMock(Environment::class);
        $config = [
            'presets' => [
                'default' => [
                    'editorType' => 'classic',
                    'config' => ['toolbar' => ['bold']],
                ],
            ],
        ];

        $configManager = new ConfigManager($config);
        $runtime = new CKEditorRuntime($twig, $configManager);

        $twig->expects($this->once())
            ->method('render')
            ->with('@CKEditor5/cke5_editor.html.twig', $this->callback(function ($parameters) {
                if ($parameters['watchdog'] !== false) {
                    return false;
                }

                $preset = json_decode($parameters['preset'], true);

                if ($preset['editorType'] !== 'inline') {
                    return false;
                }

                if (!isset($preset['config']['toolbar'])) {
                    return false;
                }

                // Check if config override worked (deep merge not verified here completely but logic should be hit)
                $content = json_decode($parameters['content'], true);

                if ($content['main'] !== 'some content') {
                    return false;
                }

                return true;
            }))
            ->willReturn('html content');

        $result = $runtime->render(
            content: 'some content',
            preset: 'default',
            watchdog: false,
            config: ['placeholder' => 'Type here'],
            mergeConfig: ['toolbar' => ['italic']],
            customTranslations: ['en' => ['foo' => 'bar']],
            editorType: 'inline'
        );
        $this->assertEquals('html content', $result);
    }
}
