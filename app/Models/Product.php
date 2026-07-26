<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = ['name', 'sku', 'cost_price', 'retail_price', 'stock_quantity', 'unit', 'custom_unit'];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'retail_price' => 'decimal:2',
        'stock_quantity' => 'decimal:3', // Added to handle fractional inventory
    ];

    // Define the relationship to product_units
    public function units(): HasMany
    {
        return $this->hasMany(ProductUnit::class);
    }

    // Logic: Convert any quantity to the base unit
    public function convertToBase($quantity, $unitId)
    {
        $unit = $this->units()->findOrFail($unitId);
        return (float) $quantity * (float) $unit->conversion_factor; // Ensure float multiplication
    }
}