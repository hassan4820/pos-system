<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        return Inertia::render('Purchase/Index', [
            'products' => Product::with('units')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'cost_price' => 'required|numeric',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $quantity = (int) $validated['quantity'];
        $costPrice = (float) $validated['cost_price'];

        $product->increment('stock_quantity', $quantity);
        $product->update(['cost_price' => number_format($costPrice, 2, '.', '')]);

        $order = Order::create([
            'type' => 'purchase',
            'total_amount' => number_format($costPrice * $quantity, 2, '.', ''),
            'discount' => 0,
            'net_amount' => number_format($costPrice * $quantity, 2, '.', ''),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $costPrice,
            'subtotal' => number_format($costPrice * $quantity, 2, '.', ''),
        ]);

        return redirect()->route('purchase.index')->with('success', 'Stock updated successfully.');
    }
}
