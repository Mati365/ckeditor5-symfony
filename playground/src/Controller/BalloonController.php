<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class BalloonController extends AbstractController
{
    #[Route('/balloon', name: 'app_balloon')]
    public function index(): Response
    {
        return $this->render('balloon/index.html.twig');
    }
}
