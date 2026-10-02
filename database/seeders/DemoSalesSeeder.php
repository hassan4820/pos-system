<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DemoSalesSeeder extends Seeder
{
    public function run(): void
    {
        // Keep this seeder safe to run more than once on a development database.
        if (Order::where('cashier_name', 'Demo Cashier')->exists()) {
            $this->command?->info('Demo sales already exist. No records were added.');

            return;
        }

        $catalog = [
            ['name' => 'Premium Flour 1kg', 'sku' => 'DEMO-FLOUR-1KG', 'cost' => 180, 'price' => 220, 'stock' => 95, 'unit' => 'Packet'],
            ['name' => 'Basmati Rice 1kg', 'sku' => 'DEMO-RICE-1KG', 'cost' => 220, 'price' => 260, 'stock' => 92, 'unit' => 'Bag'],
            ['name' => 'Fresh Milk 1L', 'sku' => 'DEMO-MILK-1L', 'cost' => 90, 'price' => 120, 'stock' => 85, 'unit' => 'Pack'],
            ['name' => 'Tea Biscuits', 'sku' => 'DEMO-BISCUIT', 'cost' => 120, 'price' => 150, 'stock' => 80, 'unit' => 'Box'],
            ['name' => 'Fruit Candy Pack', 'sku' => 'DEMO-CANDY', 'cost' => 70, 'price' => 95, 'stock' => 90, 'unit' => 'Pack'],
        ];

        $products = [];
        foreach ($catalog as $item) {
            $product = Product::firstOrCreate(
                ['sku' => $item['sku']],
                [
                    'name' => $item['name'],
                    'cost_price' => $item['cost'],
                    'retail_price' => $item['price'],
                    'stock_quantity' => $item['stock'],
                    'unit' => $item['unit'],
                ],
            );

            $unit = ProductUnit::firstOrCreate(
                ['product_id' => $product->id, 'unit_name' => $item['unit']],
                ['conversion_factor' => 1],
            );

            $products[$item['sku']] = ['product' => $product, 'unit' => $unit];
        }

        $this->createSale(Carbon::now()->subDays(6), [
            ['sku' => 'DEMO-FLOUR-1KG', 'quantity' => 5, 'price' => 220],
            ['sku' => 'DEMO-BISCUIT', 'quantity' => 4, 'price' => 150],
        ], 50, $products);

        $this->createSale(Carbon::now()->subDays(3), [
            ['sku' => 'DEMO-RICE-1KG', 'quantity' => 3, 'price' => 260],
            ['sku' => 'DEMO-MILK-1L', 'quantity' => 10, 'price' => 120],
        ], 0, $products);

        $this->createSale(Carbon::now()->subDay(), [
            ['sku' => 'DEMO-CANDY', 'quantity' => 6, 'price' => 95],
            ['sku' => 'DEMO-BISCUIT', 'quantity' => 3, 'price' => 150],
        ], 20, $products);

        $this->command?->info('Created 5 demo products and 3 demo sales.');
    }

    private function createSale(Carbon $soldAt, array $lines, float $discount, array $products): void
    {
        $total = collect($lines)->sum(fn (array $line) => $line['quantity'] * $line['price']);

        $order = Order::create([
            'type' => 'sale',
            'total_amount' => $total,
            'discount' => $discount,
            'net_amount' => $total - $discount,
            'cashier_name' => 'Demo Cashier',
        ]);
        $order->forceFill(['created_at' => $soldAt, 'updated_at' => $soldAt])->save();

        foreach ($lines as $line) {
            $entry = $products[$line['sku']];
            $product = $entry['product'];

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'unit_id' => $entry['unit']->id,
                'quantity' => $line['quantity'],
                'price' => $line['price'],
                'cost_price' => $product->cost_price,
                'subtotal' => $line['quantity'] * $line['price'],
            ]);
        }
    }
}
