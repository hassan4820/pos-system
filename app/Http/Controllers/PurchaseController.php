<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'quantity' => 'required|numeric|min:0.01',
            'cost_price' => 'required|numeric',
            'retail_price' => 'required|numeric|min:0',
        ]);

        $newQuantity = (float) $validated['quantity'];
        $newCostPrice = (float) $validated['cost_price'];
        $newRetailPrice = (float) $validated['retail_price'];

        DB::transaction(function () use ($validated, $newQuantity, $newCostPrice, $newRetailPrice) {
            $product = Product::where('id', $validated['product_id'])->lockForUpdate()->firstOrFail();

            $currentStock = (float) $product->stock_quantity;
            $currentCost = (float) $product->cost_price;

            // Moving Average Cost Calculation
            if ($currentStock > 0) {
                $totalCurrentValue = $currentStock * $currentCost;
                $totalNewValue = $newQuantity * $newCostPrice;
                $newTotalStock = $currentStock + $newQuantity;

                $averageCost = ($totalCurrentValue + $totalNewValue) / $newTotalStock;
            } else {
                $averageCost = $newCostPrice;
                $newTotalStock = $currentStock + $newQuantity;
            }

            $product->update([
                'stock_quantity' => $newTotalStock,
                'cost_price' => number_format($averageCost, 2, '.', ''),
                'retail_price' => number_format($newRetailPrice, 2, '.', ''),
            ]);

            $order = Order::create([
                'type' => 'purchase',
                'total_amount' => number_format($newCostPrice * $newQuantity, 2, '.', ''),
                'discount' => 0,
                'net_amount' => number_format($newCostPrice * $newQuantity, 2, '.', ''),
                'cashier_name' => auth()->user()?->name ?? 'System',
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $newQuantity,
                'price' => $newCostPrice, // Record the actual purchase price in history, not the average
                'cost_price' => $newCostPrice, // Same value on the purchase side — no separate concept here
                'subtotal' => number_format($newCostPrice * $newQuantity, 2, '.', ''),
            ]);
        });

        return redirect()->route('purchase.index')->with('success', 'Stock updated successfully. New average cost calculated.');
    }
}