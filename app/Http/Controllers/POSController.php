<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Inertia\Inertia;

class POSController extends Controller
{
    public function index()
    {
        return Inertia::render('POS/Index', [
            'products' => Product::with('units')->get()
        ]);
    }
}
