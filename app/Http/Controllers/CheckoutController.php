<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.conversion_factor' => 'required|integer|min:1',
            'total' => 'required|numeric',
            'discount' => 'nullable|numeric',
        ]);

        $discount = (float) ($validated['discount'] ?? 0);
        $items = [];
        $totalAmount = 0;

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $quantity = (int) $item['quantity'];
            $price = (float) $item['price'];
            $subtotal = $price * $quantity;
            $totalAmount += $subtotal;

            $baseQuantityToDeduct = $quantity * (int) $item['conversion_factor'];
            if ($product->stock_quantity < $baseQuantityToDeduct) {
                return back()->withErrors(['items' => 'Insufficient stock for ' . $product->name . '.']);
            }

            $items[] = [
                'product' => $product,
                'quantity' => $quantity,
                'price' => $price,
                'subtotal' => $subtotal,
                'base_quantity' => $baseQuantityToDeduct,
            ];
        }

        $netAmount = max(0, $totalAmount - $discount);

        $order = null;

        DB::transaction(function () use ($items, $totalAmount, $discount, $netAmount, &$order) {
            $order = Order::create([
                'type' => 'sale',
                'total_amount' => number_format($totalAmount, 2, '.', ''),
                'discount' => number_format($discount, 2, '.', ''),
                'net_amount' => number_format($netAmount, 2, '.', ''),
                'cashier_name' => auth()->user()?->name ?? 'System',
            ]);

            foreach ($items as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['subtotal'],
                ]);

                $item['product']->decrement('stock_quantity', $item['base_quantity']);
            }
        });

        return redirect()->route('invoice.show', ['order' => $order->id])->with('success', 'Sale completed successfully!');
    }
}
