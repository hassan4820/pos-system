<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index()
    {
        $this->authorizeAdmin();

        return Inertia::render('Purchase/Index', [
            'products' => Product::with('units')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|numeric|decimal:0,3|min:0.001|max:999999999999.999',
            'cost_price' => 'required|numeric|decimal:0,2|min:0|max:99999999.99',
            'retail_price' => 'required|numeric|decimal:0,2|min:0|max:99999999.99',
        ]);

        $newQuantity = round((float) $validated['quantity'], 3, PHP_ROUND_HALF_UP);
        $newCostPrice = round((float) $validated['cost_price'], 2, PHP_ROUND_HALF_UP);
        $newRetailPrice = round((float) $validated['retail_price'], 2, PHP_ROUND_HALF_UP);

        DB::transaction(function () use ($validated, $newQuantity, $newCostPrice, $newRetailPrice) {
            $product = Product::where('id', $validated['product_id'])->lockForUpdate()->firstOrFail();

            $currentStock = (float) $product->stock_quantity;
            $currentCost = (float) $product->cost_price;

            // Moving Average Cost Calculation
            if ($currentStock > 0) {
                $totalCurrentValue = $currentStock * $currentCost;
                $totalNewValue = $newQuantity * $newCostPrice;
                $newTotalStock = $currentStock + $newQuantity;

                $averageCost = round(($totalCurrentValue + $totalNewValue) / $newTotalStock, 2, PHP_ROUND_HALF_UP);
            } else {
                $averageCost = $newCostPrice;
                $newTotalStock = $currentStock + $newQuantity;
            }

            $newTotalStock = round($newTotalStock, 3, PHP_ROUND_HALF_UP);
            if ($newTotalStock > 999999999999.999) {
                throw ValidationException::withMessages([
                    'quantity' => 'The purchase would exceed the maximum supported stock quantity.',
                ]);
            }

            $purchaseTotalCents = (int) round($newCostPrice * $newQuantity * 100, 0, PHP_ROUND_HALF_UP);
            if ($purchaseTotalCents > 999999999999) {
                throw ValidationException::withMessages([
                    'quantity' => 'The purchase exceeds the maximum supported amount.',
                ]);
            }

            $purchaseTotal = $purchaseTotalCents / 100;

            $product->update([
                'stock_quantity' => $newTotalStock,
                'cost_price' => number_format($averageCost, 2, '.', ''),
                'retail_price' => number_format($newRetailPrice, 2, '.', ''),
            ]);

            $order = Order::create([
                'type' => 'purchase',
                'total_amount' => number_format($purchaseTotal, 2, '.', ''),
                'discount' => 0,
                'net_amount' => number_format($purchaseTotal, 2, '.', ''),
                'cashier_name' => auth()->user()?->name ?? 'System',
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $newQuantity,
                'price' => $newCostPrice, // Record the actual purchase price in history, not the average
                'cost_price' => $newCostPrice, // Same value on the purchase side — no separate concept here
                'subtotal' => number_format($purchaseTotal, 2, '.', ''),
            ]);
        });

        return redirect()->route('purchase.index')->with('success', 'Stock updated successfully. New average cost calculated.');
    }

    private function authorizeAdmin(): void
    {
        abort_unless(auth()->user()?->is_admin, 403);
    }
}
