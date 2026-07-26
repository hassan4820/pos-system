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
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric',
            'items.*.unit_id' => 'nullable|integer|exists:product_units,id',
            'total' => 'required|numeric',
            'discount' => 'nullable|numeric',
        ]);

        $discount = (float) ($validated['discount'] ?? 0);
        $cashierName = auth()->user()?->name ?? 'System';

        $order = null;

        try {
            DB::transaction(function () use ($validated, $discount, $cashierName, &$order) {
                // Preload products (locked) and compute each line's base-unit quantity server-side.
                // conversion_factor is never trusted from the client — only unit_id is, and the
                // factor is looked up fresh from product_units here.
                $productIds = collect($validated['items'])->pluck('product_id')->unique();
                $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

                $lines = [];
                $totalAmount = 0;
                $baseQtyNeededByProduct = [];

                foreach ($validated['items'] as $item) {
                    $product = $products[$item['product_id']];
                    $quantity = (float) $item['quantity'];
                    $price = (float) $item['price'];
                    $subtotal = $price * $quantity;
                    $totalAmount += $subtotal;

                    $factor = 1.0;
                    if (!empty($item['unit_id'])) {
                        $unit = $product->units()->find($item['unit_id']);
                        $factor = $unit ? (float) $unit->conversion_factor : 1.0;
                    }
                    $baseQuantity = $quantity * $factor;

                    $baseQtyNeededByProduct[$product->id] = ($baseQtyNeededByProduct[$product->id] ?? 0) + $baseQuantity;

                    $lines[] = [
                        'product' => $product,
                        'unit_id' => $item['unit_id'] ?? null,
                        'quantity' => $quantity,
                        'price' => $price,
                        'cost_price' => $product->cost_price, // snapshot cost at time of sale for accurate historical profit
                        'subtotal' => $subtotal,
                        'base_quantity' => $baseQuantity,
                    ];
                }

                // Check aggregated stock per product (handles the same product appearing
                // on multiple cart lines, e.g. sold in two different units at once).
                foreach ($baseQtyNeededByProduct as $productId => $neededQty) {
                    $product = $products[$productId];
                    if ((float) $product->stock_quantity < $neededQty) {
                        throw new \RuntimeException('Insufficient stock for ' . $product->name . '.');
                    }
                }

                $netAmount = max(0, $totalAmount - $discount);

                $order = Order::create([
                    'type' => 'sale',
                    'total_amount' => number_format($totalAmount, 2, '.', ''),
                    'discount' => number_format($discount, 2, '.', ''),
                    'net_amount' => number_format($netAmount, 2, '.', ''),
                    'cashier_name' => $cashierName,
                ]);

                foreach ($lines as $line) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $line['product']->id,
                        'unit_id' => $line['unit_id'],
                        'quantity' => $line['quantity'],
                        'price' => $line['price'],
                        'cost_price' => $line['cost_price'],
                        'subtotal' => $line['subtotal'],
                    ]);
                }

                foreach ($baseQtyNeededByProduct as $productId => $neededQty) {
                    $products[$productId]->decrement('stock_quantity', $neededQty);
                }
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }

        return redirect()->route('invoice.show', ['order' => $order->id])->with('success', 'Sale completed successfully!');
    }
}