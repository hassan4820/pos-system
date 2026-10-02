<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*' => 'required|array:product_id,quantity,price,unit_id',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|decimal:0,3|min:0.001|max:999999999999.999',
            'items.*.price' => 'required|numeric|decimal:0,2|min:0|max:9999999999.99',
            'items.*.unit_id' => 'nullable|integer|exists:product_units,id',
            'discount' => 'nullable|numeric|decimal:0,2|min:0|max:99999999.99',
        ]);

        $discount = round((float) ($validated['discount'] ?? 0), 2, PHP_ROUND_HALF_UP);
        $cashierName = auth()->user()?->name ?? 'System';

        $order = null;

        try {
            DB::transaction(function () use ($validated, $discount, $cashierName, &$order) {
                // Preload products (locked) and compute each line's base-unit quantity server-side.
                // conversion_factor is never trusted from the client — only unit_id is, and the
                // factor is looked up fresh from product_units here.
                $productIds = collect($validated['items'])->pluck('product_id')->unique()->sort()->values();
                $products = Product::whereIn('id', $productIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');

                $lines = [];
                $totalAmountCents = 0;
                $baseQtyNeededByProduct = [];

                foreach ($validated['items'] as $item) {
                    $product = $products->get($item['product_id']);
                    if (!$product) {
                        throw ValidationException::withMessages([
                            'items' => 'A selected product is no longer available.',
                        ]);
                    }
                    $quantity = round((float) $item['quantity'], 3, PHP_ROUND_HALF_UP);
                    $price = round((float) $item['price'], 2, PHP_ROUND_HALF_UP);
                    $lineAmount = $price * $quantity;
                    if (!is_finite($lineAmount) || $lineAmount > 9999999999.99) {
                        throw ValidationException::withMessages([
                            'items' => 'A sale line exceeds the maximum supported amount.',
                        ]);
                    }

                    $subtotalCents = (int) round($price * $quantity * 100, 0, PHP_ROUND_HALF_UP);
                    $subtotal = $subtotalCents / 100;
                    $totalAmountCents += $subtotalCents;
                    if ($totalAmountCents > 999999999999) {
                        throw ValidationException::withMessages([
                            'items' => 'The sale exceeds the maximum supported total.',
                        ]);
                    }

                    $factor = 1.0;
                    if (!empty($item['unit_id'])) {
                        $unit = $product->units()->find($item['unit_id']);
                        if (!$unit) {
                            throw ValidationException::withMessages([
                                'items' => 'A selected unit does not belong to its product.',
                            ]);
                        }

                        $factor = (float) $unit->conversion_factor;
                        if ($factor <= 0) {
                            throw ValidationException::withMessages([
                                'items' => 'The selected product unit has an invalid conversion factor.',
                            ]);
                        }
                    }
                    $baseQuantityValue = $quantity * $factor;
                    if (!is_finite($baseQuantityValue) || $baseQuantityValue > 999999999999.999) {
                        throw ValidationException::withMessages([
                            'items' => 'A sale line exceeds the maximum supported stock quantity.',
                        ]);
                    }

                    $baseQuantityMilli = (int) round($baseQuantityValue * 1000, 0, PHP_ROUND_HALF_UP);
                    $baseQuantity = $baseQuantityMilli / 1000;

                    $baseQtyNeededByProduct[$product->id] = ($baseQtyNeededByProduct[$product->id] ?? 0) + $baseQuantityMilli;
                    if ($baseQtyNeededByProduct[$product->id] > 999999999999999) {
                        throw ValidationException::withMessages([
                            'items' => 'Combined sale quantity exceeds the maximum supported stock quantity.',
                        ]);
                    }

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
                foreach ($baseQtyNeededByProduct as $productId => $neededQtyMilli) {
                    $product = $products[$productId];
                    $availableStockMilli = (int) round((float) $product->stock_quantity * 1000, 0, PHP_ROUND_HALF_UP);
                    if ($availableStockMilli < $neededQtyMilli) {
                        throw new \RuntimeException('Insufficient stock for ' . $product->name . '.');
                    }
                }

                $discountCents = (int) round($discount * 100, 0, PHP_ROUND_HALF_UP);
                if ($discountCents > $totalAmountCents) {
                    throw ValidationException::withMessages([
                        'discount' => 'The discount cannot exceed the sale subtotal.',
                    ]);
                }

                $netAmountCents = $totalAmountCents - $discountCents;

                $order = Order::create([
                    'type' => 'sale',
                    'total_amount' => number_format($totalAmountCents / 100, 2, '.', ''),
                    'discount' => number_format($discountCents / 100, 2, '.', ''),
                    'net_amount' => number_format($netAmountCents / 100, 2, '.', ''),
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
                        'subtotal' => number_format($line['subtotal'], 2, '.', ''),
                    ]);
                }

                foreach ($baseQtyNeededByProduct as $productId => $neededQtyMilli) {
                    $products[$productId]->decrement('stock_quantity', $neededQtyMilli / 1000);
                }
            });
        } catch (\RuntimeException $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }

        return redirect()->route('invoice.show', ['order' => $order->id])->with('success', 'Sale completed successfully!');
    }
}
