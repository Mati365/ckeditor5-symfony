<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Language;

use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Language\Language;

class LanguageTest extends TestCase
{
    public function testConstructorSetsUiAndContent(): void
    {
        $language = new Language('en', 'pl');

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('pl', $language->content);
    }

    public function testConstructorNormalizesUiAndContent(): void
    {
        $language = new Language('en-US', 'pl-PL');

        $this->assertEquals('en', $language->ui);
        $this->assertEquals('pl', $language->content);
    }

    public function testNormalizeLanguageCodeWithSimpleCode(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('en'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('pl'));
    }

    public function testNormalizeLanguageCodeWithHyphen(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('en-US'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('pl-PL'));
    }

    public function testNormalizeLanguageCodeWithUnderscore(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('en_US'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('pl_PL'));
    }

    public function testNormalizeLanguageCodeWithMultipleParts(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('en-US-posix'));
        $this->assertEquals('zh', Language::normalizeLanguageCode('zh-Hans-CN'));
    }

    public function testNormalizeLanguageCodeCaseInsensitive(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('EN'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('PL-PL'));
    }

    public function testNormalizeLanguageCodeWithoutDelimiter(): void
    {
        $this->assertEquals('en', Language::normalizeLanguageCode('en'));
        $this->assertEquals('xyz', Language::normalizeLanguageCode('xyz'));
    }
}
