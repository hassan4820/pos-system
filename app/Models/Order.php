<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['type', 'total_amount', 'discount', 'net_amount', 'cashier_name'];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
