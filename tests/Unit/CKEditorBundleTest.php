<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Mati365\CKEditor5Symfony\CKEditorBundle;
use Mati365\CKEditor5Symfony\DependencyInjection\CKEditorExtension;

class CKEditorBundleTest extends TestCase
{
    public function testBundleExtendsSymfonyBundle(): void
    {
        $bundle = new CKEditorBundle();

        $this->assertInstanceOf(Bundle::class, $bundle);
    }

    public function testGetPathReturnsString(): void
    {
        $bundle = new CKEditorBundle();

        $path = $bundle->getPath();

        $this->assertIsString($path);
        $this->assertStringEndsWith('ckeditor5-symfony', $path);
    }

    public function testGetContainerExtensionReturnsCKEditorExtension(): void
    {
        $bundle = new CKEditorBundle();

        $extension = $bundle->getContainerExtension();

        $this->assertInstanceOf(CKEditorExtension::class, $extension);
    }

    public function testGetContainerExtensionReturnsSameInstance(): void
    {
        $bundle = new CKEditorBundle();

        $extension1 = $bundle->getContainerExtension();
        $extension2 = $bundle->getContainerExtension();

        $this->assertSame($extension1, $extension2);
    }
}
