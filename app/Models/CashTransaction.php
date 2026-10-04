<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashTransaction extends Model
{
    protected $fillable = ['direction', 'amount', 'comment', 'order_id', 'user_id'];

    protected $casts = ['amount' => 'decimal:2'];

    public function order() { return $this->belongsTo(Order::class); }
    public function user() { return $this->belongsTo(User::class); }
}
