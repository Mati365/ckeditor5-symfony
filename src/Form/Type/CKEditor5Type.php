<?php

namespace Mati365\CKEditor5Symfony\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * @extends AbstractType<mixed>
 */
final class CKEditor5Type extends AbstractType
{
    #[\Override]
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        $view->vars['preset'] = $options['preset'];
        $view->vars['watchdog'] = $options['watchdog'];
        $view->vars['editable_height'] = $options['editable_height'];
        $view->vars['editor_config'] = $options['editor_config'];
        $view->vars['merge_config'] = $options['merge_config'];
        $view->vars['custom_translations'] = $options['custom_translations'];
        $view->vars['editor_type'] = $options['editor_type'];
        $view->vars['language'] = $options['language'];
        $view->vars['context_id'] = $options['context_id'];
        $view->vars['save_debounce_ms'] = $options['save_debounce_ms'];
    }

    #[\Override]
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'preset' => 'default',
            'watchdog' => true,
            'editable_height' => null,
            'editor_config' => null,
            'merge_config' => null,
            'custom_translations' => null,
            'editor_type' => null,
            'language' => null,
            'context_id' => null,
            'save_debounce_ms' => 200,
        ]);

        $resolver->setAllowedTypes('preset', ['string', 'null']);
        $resolver->setAllowedTypes('save_debounce_ms', ['int', 'null']);
        $resolver->setAllowedTypes('watchdog', ['bool']);
        $resolver->setAllowedTypes('editable_height', ['int', 'null']);
        $resolver->setAllowedTypes('editor_config', ['array', 'null']);
        $resolver->setAllowedTypes('merge_config', ['array', 'null']);
        $resolver->setAllowedTypes('custom_translations', ['array', 'null']);
        $resolver->setAllowedTypes('editor_type', ['string', 'null']);
        $resolver->setAllowedTypes('language', ['string', 'array', 'null']);
        $resolver->setAllowedTypes('context_id', ['string', 'null']);
    }

    public function getName(): string
    {
        return 'ckeditor5';
    }

    #[\Override]
    public function getBlockPrefix(): string
    {
        return 'ckeditor5';
    }

    #[\Override]
    public function getParent(): string
    {
        return TextareaType::class;
    }
}
