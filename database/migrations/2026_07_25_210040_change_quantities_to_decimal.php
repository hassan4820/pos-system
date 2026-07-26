<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Increased to 15, 3 to handle much larger existing numbers
            $table->decimal('stock_quantity', 15, 3)->default(0)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->decimal('quantity', 15, 3)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('unit_id')->nullable()->constrained('product_units')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock_quantity')->default(0)->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->integer('quantity')->change();
        });
    }
};