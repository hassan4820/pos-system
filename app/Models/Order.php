<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['type', 'total_amount', 'discount', 'net_amount', 'cashier_name', 'amount_received', 'change_given', 'return_of_order_id', 'returned_at'];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'change_given' => 'decimal:2',
        'returned_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function cashTransactions() { return $this->hasMany(CashTransaction::class); }
    public function originalOrder() { return $this->belongsTo(self::class, 'return_of_order_id'); }
}
