<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Mati365\CKEditor5Symfony\Preset\PresetParser;

class ClassicController extends AbstractController
{
    #[Route('/classic', name: 'app_classic')]
    public function index(): Response
    {
        return $this->render('classic/index.html.twig', [
            'preset' => PresetParser::parse([
                'editorType' => 'balloon',
                'config' => [
                    'toolbar' => ['bold', 'italic', 'undo', 'redo'],
                    'plugins' => ['Essentials', 'Paragraph', 'Bold', 'Italic', 'Undo'],
                ],
            ]),
        ]);
    }
}
