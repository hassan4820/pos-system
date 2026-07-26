<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('Products/Index', [
            'products' => Product::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku',
            'unit' => 'nullable|string|max:50',
            'custom_unit' => 'nullable|string|max:50',
        ]);

        $customUnit = $validated['custom_unit'] ?? null;
        $unit = $customUnit ?: ($validated['unit'] ?? null);

        // cost_price, retail_price, and stock_quantity are never set manually here —
        // they all start at 0 and are established by the first Purchase record
        // (see PurchaseController's moving-average logic).
        Product::create([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'cost_price' => 0,
            'retail_price' => 0,
            'stock_quantity' => 0,
            'unit' => $unit,
            'custom_unit' => $customUnit,
        ]);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku,' . $product->id, // Ignore current product ID
            'stock_quantity' => 'required|numeric|min:0',
            'unit' => 'nullable|string|max:50',
            'custom_unit' => 'nullable|string|max:50',
        ]);

        $customUnit = $validated['custom_unit'] ?? null;
        $unit = $customUnit ?: ($validated['unit'] ?? null);

        // cost_price and retail_price are intentionally excluded here.
        // cost_price: managed solely by PurchaseController's moving-average calc.
        // retail_price: managed solely by PurchaseController at time of purchase.
        $product->update([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'stock_quantity' => (float) $validated['stock_quantity'],
            'unit' => $unit,
            'custom_unit' => $customUnit,
        ]);

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        try {
            $product->delete();
            return redirect()->route('products.index')->with('success', 'Product deleted successfully.');
        } catch (QueryException $e) {
            // Prevent deletion if the product is tied to historical order_items
            return redirect()->route('products.index')->withErrors('Cannot delete product because it has existing sales or purchase records.');
        }
    }
}