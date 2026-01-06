<?php

namespace Mati365\CKEditor5Symfony\Cloud;

interface CloudLoaderInterface
{
    /**
     * Loads and parses the cloud.json file into a Cloud instance.
     */
    public function load(): ?Cloud;
}
