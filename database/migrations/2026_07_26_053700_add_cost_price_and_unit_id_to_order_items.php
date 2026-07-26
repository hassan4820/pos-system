<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->nullable()->after('price');
            }

            // unit_id is already added by 2026_07_25_210040_change_quantities_to_decimal.php —
            // do not add it again here, it will fail with a duplicate column/constraint error.
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'cost_price')) {
                $table->dropColumn('cost_price');
            }
        });
    }
};