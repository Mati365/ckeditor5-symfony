<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Language;

use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Language\LanguageParser;

class LanguageParserTest extends TestCase
{
    public function testParseWithStringInput(): void
    {
        $language = LanguageParser::parse('en');

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('en', $language->content);
    }

    public function testParseWithStringInputNormalized(): void
    {
        $language = LanguageParser::parse('en-US');

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('en', $language->content);
    }

    public function testParseWithArrayInputUiOnly(): void
    {
        $language = LanguageParser::parse(['ui' => 'pl']);

        $this->assertEquals('pl', $language->ui);
        $this->assertEquals('en', $language->content);
    }

    public function testParseWithArrayInputContentOnly(): void
    {
        $language = LanguageParser::parse(['content' => 'fr']);

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('fr', $language->content);
    }

    public function testParseWithArrayInputBoth(): void
    {
        $language = LanguageParser::parse(['ui' => 'de', 'content' => 'fr']);

        $this->assertEquals('de', $language->ui);
        $this->assertEquals('fr', $language->content);
    }

    public function testParseWithArrayInputNormalized(): void
    {
        $language = LanguageParser::parse(['ui' => 'de-DE', 'content' => 'fr-FR']);

        $this->assertEquals('de', $language->ui);
        $this->assertEquals('fr', $language->content);
    }

    public function testParseWithNullInput(): void
    {
        $language = LanguageParser::parse(null);

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('en', $language->content);
    }

    public function testParseWithEmptyArray(): void
    {
        $language = LanguageParser::parse([]);

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('en', $language->content);
    }

    public function testParseWithInvalidArrayValues(): void
    {
        // Since the code doesn't validate types, it defaults
        $language = LanguageParser::parse(['ui' => 123, 'content' => null]);

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('en', $language->content);
    }
}
