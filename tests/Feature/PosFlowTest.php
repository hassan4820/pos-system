<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_checkout_creates_order_and_reduces_stock(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $product = Product::create([
            'name' => 'Tea Pack',
            'sku' => 'TEA-001',
            'cost_price' => 50,
            'retail_price' => 80,
            'stock_quantity' => 10,
        ]);

        $unit = ProductUnit::create([
            'product_id' => $product->id,
            'unit_name' => 'Case',
            'conversion_factor' => 2,
        ]);

        $response = $this->post('/checkout', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 80,
                'unit_id' => $unit->id,
            ]],
            'total' => 160,
            'discount' => 0,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('orders', [
            'type' => 'sale',
            'net_amount' => '160.00',
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'cost_price' => '50.00',
        ]);
        $this->assertSame(6, (int) $product->fresh()->stock_quantity);
    }

    public function test_purchase_updates_stock_and_cost_price(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $product = Product::create([
            'name' => 'Coffee Bag',
            'sku' => 'COF-001',
            'cost_price' => 40,
            'retail_price' => 70,
            'stock_quantity' => 5,
        ]);

        $response = $this->post('/purchase', [
            'product_id' => $product->id,
            'quantity' => 3,
            'cost_price' => 45,
        ]);

        $response->assertRedirect();
        $this->assertSame(8, (int) $product->fresh()->stock_quantity);
        $expectedAverage = number_format((5 * 40 + 3 * 45) / 8, 2, '.', '');
        $this->assertSame($expectedAverage, (string) $product->fresh()->cost_price);
    }

    public function test_reports_page_shows_profit_summary(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $product = Product::create([
            'name' => 'Water Bottle',
            'sku' => 'WTR-001',
            'cost_price' => 20,
            'retail_price' => 35,
            'stock_quantity' => 10,
        ]);

        $this->post('/checkout', [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 35,
                'unit_id' => null,
            ]],
            'total' => 35,
            'discount' => 0,
        ]);

        $response = $this->get('/reports');

        $response->assertOk();
        $response->assertSee('Profit');
        $response->assertSee('"productProfit"');
        $response->assertSee('"monthlySales"');
    }
}
