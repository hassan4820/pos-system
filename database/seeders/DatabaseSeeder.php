<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password'), 'is_admin' => true, 'role' => 1]
        );

        User::firstOrCreate(
            ['email' => 'staff@example.com'],
            ['name' => 'Staff User', 'password' => bcrypt('password'), 'is_admin' => false, 'role' => 2]
        );

        $products = [
            ['name' => 'آٹا', 'sku' => 'ATA-001', 'cost_price' => 180, 'retail_price' => 220, 'stock_quantity' => 100, 'unit' => 'کلو', 'units' => [['unit_name' => 'کلو', 'conversion_factor' => 1]]],
            ['name' => 'چاول', 'sku' => 'CHAWL-001', 'cost_price' => 220, 'retail_price' => 260, 'stock_quantity' => 80, 'unit' => 'کلو', 'units' => [['unit_name' => 'کلو', 'conversion_factor' => 1]]],
            ['name' => 'چینی', 'sku' => 'CHINI-001', 'cost_price' => 160, 'retail_price' => 200, 'stock_quantity' => 60, 'unit' => 'کلو', 'units' => [['unit_name' => 'کلو', 'conversion_factor' => 1]]],
            ['name' => 'بیسکٹ', 'sku' => 'BISK-001', 'cost_price' => 120, 'retail_price' => 150, 'stock_quantity' => 90, 'unit' => 'بکس', 'units' => [['unit_name' => 'بکس', 'conversion_factor' => 1]]],
            ['name' => 'دودھ', 'sku' => 'DOODH-001', 'cost_price' => 90, 'retail_price' => 120, 'stock_quantity' => 70, 'unit' => 'پیکٹ', 'units' => [['unit_name' => 'پیکٹ', 'conversion_factor' => 1]]],
            ['name' => 'کینڈی', 'sku' => 'KANDI-001', 'cost_price' => 70, 'retail_price' => 95, 'stock_quantity' => 50, 'unit' => 'پیکٹ', 'units' => [['unit_name' => 'پیکٹ', 'conversion_factor' => 1]]],
        ];

        foreach ($products as $productData) {
            $product = Product::firstOrCreate(
                ['sku' => $productData['sku']],
                [
                    'name' => $productData['name'],
                    'cost_price' => $productData['cost_price'],
                    'retail_price' => $productData['retail_price'],
                    'stock_quantity' => $productData['stock_quantity'],
                    'unit' => $productData['unit'],
                    'custom_unit' => null,
                ]
            );

            $product->units()->delete();

            foreach ($productData['units'] as $unitData) {
                ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_name' => $unitData['unit_name'],
                    'conversion_factor' => $unitData['conversion_factor'],
                ]);
            }
        }
    }
}
