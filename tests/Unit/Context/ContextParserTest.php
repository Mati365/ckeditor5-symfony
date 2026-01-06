<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Context;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Context\ContextParser;

class ContextParserTest extends TestCase
{
    public function testParseValidData(): void
    {
        $data = [
            'config' => ['plugins' => ['Bold']],
            'watchdogConfig' => ['timeout' => 5000],
            'customTranslations' => ['en' => ['Ok' => 'Okay']],
        ];

        $context = ContextParser::parse($data);

        $this->assertSame($data['config'], $context->config);
        $this->assertSame($data['watchdogConfig'], $context->watchdogConfig);
        $this->assertSame($data['customTranslations'], $context->customTranslations);
    }

    public function testParseMinimalData(): void
    {
        $data = [
            'config' => ['plugins' => ['Bold']],
        ];

        $context = ContextParser::parse($data);

        $this->assertEquals($data['config'], $context->config);
        $this->assertNull($context->watchdogConfig);
        $this->assertNull($context->customTranslations);
    }

    public function testParseMissingConfigThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Context config validation failed');

        ContextParser::parse([]);
    }

    public function testParseInvalidConfigTypeThrowsException(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Context config validation failed');

        ContextParser::parse(['config' => 'invalid']);
    }

    public function testDump(): void
    {
        $data = [
            'config' => ['plugins' => ['Bold']],
            'watchdogConfig' => ['timeout' => 5000],
            'customTranslations' => ['en' => ['Ok' => 'Okay']],
        ];

        $context = ContextParser::parse($data);
        $dumped = ContextParser::dump($context);

        $this->assertEquals($data, $dumped);
    }

    public function testDumpMinimal(): void
    {
        $data = [
            'config' => ['plugins' => ['Bold']],
        ];

        $context = ContextParser::parse($data);
        $dumped = ContextParser::dump($context);

        $this->assertEquals($data, $dumped);
    }
}
