<?php

namespace Mati365\CKEditor5Symfony\Language;

/**
 * Mocking class_exists to simulate absence of Locale class.
 * This function overrides the global class_exists when called within this namespace.
 */
function class_exists(string $class, bool $autoload = true): bool
{
    global $mockLocaleClassExists;

    if ($class === \Locale::class && isset($mockLocaleClassExists) && $mockLocaleClassExists === false) {
        return false;
    }

    return \class_exists($class, $autoload);
}

namespace Mati365\CKEditor5Symfony\Tests\Unit\Language;

use PHPUnit\Framework\TestCase;
use Mati365\CKEditor5Symfony\Language\Language;

class LanguageFallbackTest extends TestCase
{
    protected function setUp(): void
    {
        global $mockLocaleClassExists;
        $mockLocaleClassExists = false;
    }

    protected function tearDown(): void
    {
        global $mockLocaleClassExists;
        $mockLocaleClassExists = true;
    }

    public function testNormalizeLanguageCodeFallbackWithHyphen(): void
    {
        // Should use fallback logic: split by '-'
        $this->assertEquals('en', Language::normalizeLanguageCode('en-US'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('pl-PL'));
        $this->assertEquals('zh', Language::normalizeLanguageCode('zh-Hans-CN'));
    }

    public function testNormalizeLanguageCodeFallbackWithUnderscore(): void
    {
        // Should use fallback logic: split by '_'
        $this->assertEquals('en', Language::normalizeLanguageCode('en_US'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('pl_PL'));
    }

    public function testNormalizeLanguageCodeFallbackSimple(): void
    {
        // Should return as is (lowercase)
        $this->assertEquals('en', Language::normalizeLanguageCode('en'));
        $this->assertEquals('pl', Language::normalizeLanguageCode('PL'));
    }
}
