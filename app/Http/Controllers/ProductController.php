<?php

namespace App\Http\Controllers;

use App\Models\Product;
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
            'cost_price' => 'required|numeric',
            'retail_price' => 'required|numeric',
            'stock_quantity' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'custom_unit' => 'nullable|string|max:50',
        ]);

        $customUnit = $validated['custom_unit'] ?? null;
        $unit = $customUnit ?: ($validated['unit'] ?? null);

        Product::create([
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'cost_price' => number_format((float) $validated['cost_price'], 2, '.', ''),
            'retail_price' => number_format((float) $validated['retail_price'], 2, '.', ''),
            'stock_quantity' => (int) ($validated['stock_quantity'] ?? 0),
            'unit' => $unit,
            'custom_unit' => $customUnit,
        ]);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }
}
