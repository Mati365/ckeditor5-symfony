<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class MultirootController extends AbstractController
{
    #[Route('/multiroot', name: 'app_multiroot')]
    public function index(): Response
    {
        return $this->render('multiroot/index.html.twig');
    }
}
