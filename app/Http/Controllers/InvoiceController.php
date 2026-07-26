<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function show(Order $order)
    {
        $order->load(['items.product', 'items.unit']);

        return Inertia::render('Invoice/Show', [
            'order' => $order,
        ]);
    }
}