<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class BakeryProductSeeder extends Seeder
{
    /**
     * Add sample bakery catalogue items without overwriting existing products.
     */
    public function run(): void
    {
        $products = [
            ['name' => 'Classic White Bread', 'sku' => 'BAK-BREAD-001', 'cost_price' => 110, 'retail_price' => 150, 'stock_quantity' => 35, 'unit' => 'pcs'],
            ['name' => 'Whole Wheat Bread', 'sku' => 'BAK-BREAD-002', 'cost_price' => 135, 'retail_price' => 180, 'stock_quantity' => 28, 'unit' => 'pcs'],
            ['name' => 'Milk Bread Loaf', 'sku' => 'BAK-BREAD-003', 'cost_price' => 125, 'retail_price' => 170, 'stock_quantity' => 24, 'unit' => 'pcs'],
            ['name' => 'Butter Croissant', 'sku' => 'BAK-PASTRY-001', 'cost_price' => 75, 'retail_price' => 120, 'stock_quantity' => 40, 'unit' => 'pcs'],
            ['name' => 'Chocolate Chip Cookie', 'sku' => 'BAK-COOKIE-001', 'cost_price' => 35, 'retail_price' => 60, 'stock_quantity' => 80, 'unit' => 'pcs'],
            ['name' => 'Fudge Brownie', 'sku' => 'BAK-BROWNIE-001', 'cost_price' => 85, 'retail_price' => 140, 'stock_quantity' => 30, 'unit' => 'pcs'],
            ['name' => 'Chocolate Muffin', 'sku' => 'BAK-MUFFIN-001', 'cost_price' => 70, 'retail_price' => 110, 'stock_quantity' => 36, 'unit' => 'pcs'],
            ['name' => 'Glazed Donut', 'sku' => 'BAK-DONUT-001', 'cost_price' => 45, 'retail_price' => 80, 'stock_quantity' => 32, 'unit' => 'pcs'],
            ['name' => 'Chicken Patties', 'sku' => 'BAK-SAVORY-001', 'cost_price' => 80, 'retail_price' => 130, 'stock_quantity' => 25, 'unit' => 'pcs'],
            ['name' => 'Chicken Puff Pastry', 'sku' => 'BAK-SAVORY-002', 'cost_price' => 90, 'retail_price' => 150, 'stock_quantity' => 22, 'unit' => 'pcs'],
            ['name' => 'Rusk', 'sku' => 'BAK-RUSK-001', 'cost_price' => 180, 'retail_price' => 260, 'stock_quantity' => 18, 'unit' => 'kg'],
            ['name' => 'Plain Cake Slice', 'sku' => 'BAK-CAKE-001', 'cost_price' => 95, 'retail_price' => 160, 'stock_quantity' => 20, 'unit' => 'pcs'],
            ['name' => 'Chocolate Cake Slice', 'sku' => 'BAK-CAKE-002', 'cost_price' => 130, 'retail_price' => 220, 'stock_quantity' => 16, 'unit' => 'pcs'],
            ['name' => 'Fresh Cream Cake', 'sku' => 'BAK-CAKE-003', 'cost_price' => 950, 'retail_price' => 1450, 'stock_quantity' => 6, 'unit' => 'pcs'],
            ['name' => 'Plain Cupcake', 'sku' => 'BAK-CUPCAKE-001', 'cost_price' => 40, 'retail_price' => 70, 'stock_quantity' => 48, 'unit' => 'pcs'],
            ['name' => 'Chocolate Cupcake', 'sku' => 'BAK-CUPCAKE-002', 'cost_price' => 55, 'retail_price' => 90, 'stock_quantity' => 42, 'unit' => 'pcs'],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['sku' => $product['sku']],
                [...$product, 'custom_unit' => null],
            );
        }
    }
}
