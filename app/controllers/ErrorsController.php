<?php

class ErrorsController extends ControllerBase
{
    public function initialize()
    {
        $this->tag->setTitle('Oops!');
        parent::initialize();
    }

    public function show403Action()
    {

    }

    public function show404Action()
    {

    }

    public function show500Action()
    {

    }
}
