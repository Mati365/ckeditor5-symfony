<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TranslationsController extends AbstractController
{
    #[Route('/translations', name: 'app_translations')]
    public function index(): Response
    {
        return $this->render('translations/index.html.twig');
    }
}
