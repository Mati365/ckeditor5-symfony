<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DecoupledController extends AbstractController
{
    #[Route('/decoupled', name: 'app_decoupled')]
    public function index(): Response
    {
        return $this->render('decoupled/index.html.twig');
    }
}
