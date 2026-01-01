<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class InlineController extends AbstractController
{
    #[Route('/inline', name: 'app_inline')]
    public function index(): Response
    {
        return $this->render('inline/index.html.twig');
    }
}
