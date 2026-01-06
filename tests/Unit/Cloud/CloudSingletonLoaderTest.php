<?php

namespace Mati365\CKEditor5Symfony\Tests\Unit\Cloud;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;
use Mati365\CKEditor5Symfony\Cloud\Cloud;
use Mati365\CKEditor5Symfony\Cloud\CloudSingletonLoader;

class CloudSingletonLoaderTest extends TestCase
{
    private vfsStreamDirectory $vfs;

    protected function setUp(): void
    {
        $this->vfs = vfsStream::setup('root');
    }

    public function testConstructorSetsPath(): void
    {
        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        // Since path is private, we can't directly test, but we can test behavior
        $this->assertInstanceOf(CloudSingletonLoader::class, $loader);
    }

    public function testLoadReturnsNullWhenFileDoesNotExist(): void
    {
        $path = vfsStream::url('root/nonexistent.json');
        $loader = new CloudSingletonLoader($path);
        $result = $loader->load();

        $this->assertNull($result);
    }

    public function testLoadReturnsNullWhenFileGetContentsFails(): void
    {
        vfsStream::newDirectory('cloud.json')->at($this->vfs);

        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        $result = $loader->load();

        $this->assertNull($result);
    }

    public function testLoadReturnsNullWhenJsonDecodeFails(): void
    {
        vfsStream::newFile('cloud.json')
            ->withContent('invalid json')
            ->at($this->vfs);

        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        $result = $loader->load();

        $this->assertNull($result);
    }

    public function testLoadReturnsNullWhenJsonDecodeReturnsNonArray(): void
    {
        vfsStream::newFile('cloud.json')
            ->withContent('"string"')
            ->at($this->vfs);

        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        $result = $loader->load();

        $this->assertNull($result);
    }

    public function testLoadThrowsWhenCloudParserThrows(): void
    {
        vfsStream::newFile('cloud.json')
            ->withContent('{"invalid": "data"}')
            ->at($this->vfs);

        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        $this->expectException(InvalidArgumentException::class);

        $loader->load();
    }

    public function testLoadReturnsCloudWhenValidJson(): void
    {
        $json = json_encode([
            'editorVersion' => '36.0.0',
            'premium' => false,
        ]);

        vfsStream::newFile('cloud.json')
            ->withContent($json)
            ->at($this->vfs);
        $path = vfsStream::url('root/cloud.json');

        $loader = new CloudSingletonLoader($path);

        $result = $loader->load();

        $this->assertInstanceOf(Cloud::class, $result);
        $this->assertSame('36.0.0', $result->editorVersion);
        $this->assertFalse($result->premium);
    }

    public function testLoadCachesResult(): void
    {
        $json = json_encode([
            'editorVersion' => '36.0.0',
            'premium' => false,
        ]);

        vfsStream::newFile('cloud.json')
            ->withContent($json)
            ->at($this->vfs);

        $path = vfsStream::url('root/cloud.json');
        $loader = new CloudSingletonLoader($path);

        $result1 = $loader->load();
        $result2 = $loader->load();

        $this->assertSame($result1, $result2);
    }
}
