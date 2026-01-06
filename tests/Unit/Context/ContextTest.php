<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Context;

use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Context\Context;

class ContextTest extends TestCase
{
    public function testConstructor(): void
    {
        $config = ['plugins' => ['Bold']];
        $watchdogConfig = ['timeout' => 5000];
        $customTranslations = ['en' => ['Ok' => 'Okay']];

        $context = new Context($config, $watchdogConfig, $customTranslations);

        $this->assertSame($config, $context->config);
        $this->assertSame($watchdogConfig, $context->watchdogConfig);
        $this->assertSame($customTranslations, $context->customTranslations);
    }

    public function testClone(): void
    {
        $config = ['plugins' => ['Bold']];
        $context = new Context($config);
        $clone = $context->clone();

        $this->assertNotSame($context, $clone);
        $this->assertEquals($context->config, $clone->config);

        // Test deep clone
        $clone->config['plugins'][] = 'Italic';
        $this->assertNotContains('Italic', $context->config['plugins']);
    }

    public function testOfConfig(): void
    {
        $context = new Context(['plugins' => ['Bold']]);
        $newConfig = ['plugins' => ['Italic']];

        $newContext = $context->ofConfig($newConfig);

        $this->assertNotSame($context, $newContext);
        $this->assertSame($newConfig, $newContext->config);
        $this->assertSame(['plugins' => ['Bold']], $context->config);
    }

    public function testOfWatchdogConfig(): void
    {
        $context = new Context(['plugins' => ['Bold']], ['timeout' => 1000]);
        $newWatchdogConfig = ['timeout' => 2000];

        $newContext = $context->ofWatchdogConfig($newWatchdogConfig);

        $this->assertNotSame($context, $newContext);
        $this->assertSame($newWatchdogConfig, $newContext->watchdogConfig);
        $this->assertSame(['timeout' => 1000], $context->watchdogConfig);
    }

    public function testOfCustomTranslations(): void
    {
        $context = new Context(['plugins' => ['Bold']], null, ['en' => []]);
        $newTranslations = ['pl' => []];

        $newContext = $context->ofCustomTranslations($newTranslations);

        $this->assertNotSame($context, $newContext);
        $this->assertSame($newTranslations, $newContext->customTranslations);
        $this->assertSame(['en' => []], $context->customTranslations);
    }
}
