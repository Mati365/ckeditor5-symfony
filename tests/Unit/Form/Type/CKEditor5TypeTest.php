<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Form\Type;

use Mati365\CKEditor5Symfony\Form\Type\CKEditor5Type;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

class CKEditor5TypeTest extends TestCase
{
    public function testBuildView(): void
    {
        $type = new CKEditor5Type();
        $view = new FormView();
        $form = $this->createMock(FormInterface::class);
        $options = [
            'preset' => 'default',
            'watchdog' => true,
            'editable_height' => 500,
            'editor_config' => ['foo' => 'bar'],
            'merge_config' => ['baz' => 'qux'],
            'custom_translations' => ['en' => ['foo' => 'bar']],
            'editor_type' => 'classic',
            'language' => 'en',
            'context_id' => 'context_1',
            'save_debounce_ms' => 200,
        ];

        $type->buildView($view, $form, $options);

        $this->assertArrayHasKey('preset', $view->vars);
        $this->assertEquals('default', $view->vars['preset']);

        $this->assertArrayHasKey('watchdog', $view->vars);
        $this->assertEquals(true, $view->vars['watchdog']);

        $this->assertArrayHasKey('editable_height', $view->vars);
        $this->assertEquals(500, $view->vars['editable_height']);

        $this->assertArrayHasKey('editor_config', $view->vars);
        $this->assertEquals(['foo' => 'bar'], $view->vars['editor_config']);

        $this->assertArrayHasKey('merge_config', $view->vars);
        $this->assertEquals(['baz' => 'qux'], $view->vars['merge_config']);

        $this->assertArrayHasKey('custom_translations', $view->vars);
        $this->assertEquals(['en' => ['foo' => 'bar']], $view->vars['custom_translations']);

        $this->assertArrayHasKey('editor_type', $view->vars);
        $this->assertEquals('classic', $view->vars['editor_type']);

        $this->assertArrayHasKey('language', $view->vars);
        $this->assertEquals('en', $view->vars['language']);

        $this->assertArrayHasKey('context_id', $view->vars);
        $this->assertEquals('context_1', $view->vars['context_id']);
    }

    public function testConfigureOptions(): void
    {
        $type = new CKEditor5Type();
        $resolver = new OptionsResolver();

        $type->configureOptions($resolver);

        $options = $resolver->resolve([]);

        $this->assertEquals('default', $options['preset']);
        $this->assertTrue($options['watchdog']);
        $this->assertNull($options['editable_height']);
        $this->assertNull($options['editor_config']);
        $this->assertNull($options['merge_config']);
        $this->assertNull($options['custom_translations']);
        $this->assertNull($options['editor_type']);
        $this->assertNull($options['language']);
        $this->assertNull($options['context_id']);
    }

    public function testGetParent(): void
    {
        $type = new CKEditor5Type();
        $this->assertEquals(TextareaType::class, $type->getParent());
    }

    public function testGetBlockPrefix(): void
    {
        $type = new CKEditor5Type();
        $this->assertEquals('ckeditor5', $type->getBlockPrefix());
    }

    public function testGetName(): void
    {
        $type = new CKEditor5Type();
        $this->assertEquals('ckeditor5', $type->getName());
    }
}
