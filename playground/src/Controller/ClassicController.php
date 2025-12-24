<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ClassicController extends AbstractController
{
    #[Route('/classic', name: 'app_classic')]
    public function index(): Response
    {
        return $this->render('classic/index.html.twig');
    }
}
