<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PosFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sale_checkout_creates_order_and_reduces_stock(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
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
                'price' => 160,
                'unit_id' => $unit->id,
            ]],
            'total' => 1, // Server totals come from validated receipt lines, never the client.
            'discount' => 20,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('orders', [
            'type' => 'sale',
            'total_amount' => '320.00',
            'discount' => '20.00',
            'net_amount' => '300.00',
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'cost_price' => '50.00',
        ]);
        $this->assertSame(6, (int) $product->fresh()->stock_quantity);

        $this->get('/reports')->assertInertia(fn (Assert $page) => $page
            ->where('totalSales', 300)
            ->where('totalProfit', 100)
            ->where('productProfit.0.sales', 300)
            ->where('productProfit.0.cost', 200)
            ->where('productProfit.0.profit', 100)
            ->where('weeklyProfit.0.amount', 100)
            ->where('dailyProfit.0.amount', 100));
    }

    public function test_purchase_updates_stock_and_cost_price(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
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
            'retail_price' => 70,
        ]);

        $response->assertRedirect();
        $this->assertSame(8, (int) $product->fresh()->stock_quantity);
        $expectedAverage = number_format((5 * 40 + 3 * 45) / 8, 2, '.', '');
        $this->assertSame($expectedAverage, (string) $product->fresh()->cost_price);
    }

    public function test_purchase_records_fractional_quantities_and_rounded_totals(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));

        $product = Product::create([
            'name' => 'Vanilla',
            'sku' => 'VAN-001',
            'cost_price' => 40,
            'retail_price' => 50,
            'stock_quantity' => 0.001,
        ]);

        $this->post('/purchase', [
            'product_id' => $product->id,
            'quantity' => 0.002,
            'cost_price' => 45.01,
            'retail_price' => 55.25,
        ])->assertRedirect();

        $this->assertSame('0.003', (string) $product->fresh()->stock_quantity);
        $this->assertSame('43.34', (string) $product->fresh()->cost_price);
        $this->assertDatabaseHas('orders', [
            'type' => 'purchase',
            'total_amount' => '0.09',
            'net_amount' => '0.09',
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product->id,
            'quantity' => '0.002',
            'subtotal' => '0.09',
        ]);
    }

    public function test_sale_rejects_negative_price_and_discount_larger_than_subtotal(): void
    {
        $this->actingAs(User::factory()->create());
        $product = Product::create([
            'name' => 'Flour',
            'sku' => 'FLOUR-001',
            'cost_price' => 10,
            'retail_price' => 15,
            'stock_quantity' => 5,
        ]);

        $line = ['product_id' => $product->id, 'quantity' => 1, 'price' => -1, 'unit_id' => null];
        $this->post('/checkout', ['items' => [$line], 'discount' => 0])->assertSessionHasErrors('items.0.price');

        $line['price'] = 10;
        $this->post('/checkout', ['items' => [$line], 'discount' => 10.01])->assertSessionHasErrors('discount');

        $this->assertSame('5.000', (string) $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_sale_rejects_a_unit_that_belongs_to_a_different_product(): void
    {
        $this->actingAs(User::factory()->create());
        $first = Product::create(['name' => 'First', 'sku' => 'FIRST-001', 'cost_price' => 1, 'retail_price' => 2, 'stock_quantity' => 5]);
        $second = Product::create(['name' => 'Second', 'sku' => 'SECOND-001', 'cost_price' => 1, 'retail_price' => 2, 'stock_quantity' => 5]);
        $foreignUnit = ProductUnit::create(['product_id' => $second->id, 'unit_name' => 'Case', 'conversion_factor' => 6]);

        $this->post('/checkout', [
            'items' => [['product_id' => $first->id, 'quantity' => 1, 'price' => 2, 'unit_id' => $foreignUnit->id]],
            'discount' => 0,
        ])->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
        $this->assertSame('5.000', (string) $first->fresh()->stock_quantity);
        $this->assertSame('5.000', (string) $second->fresh()->stock_quantity);
    }

    public function test_purchase_rejects_negative_costs(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $product = Product::create(['name' => 'Yeast', 'sku' => 'YEAST-001', 'cost_price' => 1, 'retail_price' => 2, 'stock_quantity' => 5]);

        $this->post('/purchase', [
            'product_id' => $product->id,
            'quantity' => 1,
            'cost_price' => -10,
            'retail_price' => 2,
        ])->assertSessionHasErrors('cost_price');

        $this->assertSame('5.000', (string) $product->fresh()->stock_quantity);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_sale_rounds_each_receipt_line_to_currency_precision(): void
    {
        $this->actingAs(User::factory()->create());
        $product = Product::create([
            'name' => 'Mini Roll',
            'sku' => 'ROLL-001',
            'cost_price' => 0,
            'retail_price' => 0.01,
            'stock_quantity' => 1,
        ]);

        $this->post('/checkout', [
            'items' => [
                ['product_id' => $product->id, 'quantity' => 0.500, 'price' => 0.01, 'unit_id' => null],
                ['product_id' => $product->id, 'quantity' => 0.500, 'price' => 0.01, 'unit_id' => null],
            ],
            'discount' => 0.01,
        ])->assertRedirect();

        $this->assertDatabaseHas('orders', ['total_amount' => '0.02', 'discount' => '0.01', 'net_amount' => '0.01']);
        $this->assertDatabaseCount('order_items', 2);
        $this->assertSame('0.000', (string) $product->fresh()->stock_quantity);

        $this->get('/reports')->assertInertia(fn (Assert $page) => $page
            ->where('totalSales', 0.01)
            ->where('totalProfit', 0.01)
            ->where('productProfit.0.sales', 0.01));
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

    public function test_staff_cannot_manage_products_or_record_purchases(): void
    {
        $staff = User::factory()->create(['is_admin' => false]);
        $product = Product::create([
            'name' => 'Restricted Product',
            'sku' => 'RESTRICTED-001',
            'cost_price' => 10,
            'retail_price' => 20,
            'stock_quantity' => 5,
        ]);

        $this->actingAs($staff)->get('/products')->assertForbidden();
        $this->put('/products/'.$product->id, [
            'name' => $product->name,
            'sku' => $product->sku,
            'stock_quantity' => 999,
        ])->assertForbidden();
        $this->post('/purchase', [
            'product_id' => $product->id,
            'quantity' => 1,
            'cost_price' => 10,
            'retail_price' => 20,
        ])->assertForbidden();
    }

    public function test_purchase_order_cannot_be_viewed_as_a_customer_invoice(): void
    {
        $user = User::factory()->create();
        $purchase = Order::create([
            'type' => 'purchase',
            'total_amount' => 100,
            'discount' => 0,
            'net_amount' => 100,
            'cashier_name' => $user->name,
        ]);

        $this->actingAs($user)->get('/invoice/'.$purchase->id)->assertNotFound();
    }
}
