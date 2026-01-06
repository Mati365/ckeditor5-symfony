<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Mati365\CKEditor5Symfony\Form\Type\CKEditor5Type;

class FormController extends AbstractController
{
    #[Route('/form', name: 'app_form')]
    public function index(Request $request): Response
    {
        $form = $this->createFormBuilder()
            ->add('content', CKEditor5Type::class, [
                'label' => 'Content',
                'required' => true,
                'label_attr' => ['class' => 'mb-2 block font-bold text-gray-700'],
            ])
            ->getForm();

        $form->handleRequest($request);

        $data = null;
        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();
        }

        return $this->render('form/index.html.twig', [
            'form' => $form->createView(),
            'data' => $data,
        ]);
    }
}
