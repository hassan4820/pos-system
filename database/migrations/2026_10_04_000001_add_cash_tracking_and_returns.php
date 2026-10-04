<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('amount_received', 12, 2)->default(0);
            $table->decimal('change_given', 12, 2)->default(0);
            $table->foreignId('return_of_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->timestamp('returned_at')->nullable();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('type')->change();
        });

        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('direction', ['in', 'out']);
            $table->decimal('amount', 12, 2);
            $table->string('comment');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_transactions');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['return_of_order_id']);
            $table->dropColumn(['amount_received', 'change_given', 'return_of_order_id', 'returned_at']);
            $table->enum('type', ['sale', 'purchase'])->change();
        });
    }
};
