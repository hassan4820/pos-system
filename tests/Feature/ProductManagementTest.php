<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_products_can_be_created_with_cost_and_retail_prices(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/products', [
            'name' => 'Sugar',
            'sku' => 'SUG-001',
            'cost_price' => '120.50',
            'retail_price' => '160.00',
            'stock_quantity' => 10,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'sku' => 'SUG-001',
            'cost_price' => '120.50',
            'retail_price' => '160.00',
            'stock_quantity' => 10,
        ]);
    }
}
