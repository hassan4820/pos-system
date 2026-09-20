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
}
