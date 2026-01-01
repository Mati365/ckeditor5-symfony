<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ContextController extends AbstractController
{
    #[Route('/context', name: 'app_context')]
    public function index(): Response
    {
        return $this->render('context/index.html.twig');
    }
}
