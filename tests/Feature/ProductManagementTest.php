<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_product_with_zero_opening_inventory(): void
    {
        $user = User::factory()->create(['is_admin' => true]);
        $this->actingAs($user);

        $response = $this->post('/products', [
            'name' => 'Sugar',
            'sku' => 'SUG-001',
            'unit' => 'kg',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'sku' => 'SUG-001',
            'cost_price' => '0.00',
            'retail_price' => '0.00',
            'stock_quantity' => '0.000',
        ]);
    }

    public function test_editing_a_custom_unit_keeps_it_and_switching_to_a_standard_unit_clears_it(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $product = \App\Models\Product::create([
            'name' => 'Cake Box',
            'sku' => 'CAKE-BOX',
            'cost_price' => 0,
            'retail_price' => 0,
            'stock_quantity' => 3,
            'unit' => 'box',
            'custom_unit' => 'box',
        ]);

        $this->put('/products/'.$product->id, [
            'name' => 'Cake Box',
            'sku' => 'CAKE-BOX',
            'stock_quantity' => '3.125',
            'unit' => 'custom',
            'custom_unit' => 'box',
        ])->assertRedirect();

        $this->assertSame('box', $product->fresh()->unit);
        $this->assertSame('box', $product->fresh()->custom_unit);
        $this->assertSame('3.125', (string) $product->fresh()->stock_quantity);

        $this->put('/products/'.$product->id, [
            'name' => 'Cake Box',
            'sku' => 'CAKE-BOX',
            'stock_quantity' => '3.125',
            'unit' => 'pcs',
            'custom_unit' => 'box',
        ])->assertRedirect();

        $this->assertSame('pcs', $product->fresh()->unit);
        $this->assertNull($product->fresh()->custom_unit);
    }

    public function test_stock_adjustment_rejects_more_than_three_decimal_places(): void
    {
        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $product = \App\Models\Product::create([
            'name' => 'Sugar',
            'sku' => 'SUG-DECIMAL',
            'cost_price' => 0,
            'retail_price' => 0,
            'stock_quantity' => 0,
        ]);

        $this->put('/products/'.$product->id, [
            'name' => 'Sugar',
            'sku' => 'SUG-DECIMAL',
            'stock_quantity' => '1.0001',
            'unit' => 'kg',
        ])->assertSessionHasErrors('stock_quantity');

        $this->assertSame('0.000', (string) $product->fresh()->stock_quantity);
    }
}
