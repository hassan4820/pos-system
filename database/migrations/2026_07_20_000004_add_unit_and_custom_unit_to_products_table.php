<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'unit')) {
                $table->string('unit')->nullable()->after('stock_quantity');
            }

            if (!Schema::hasColumn('products', 'custom_unit')) {
                $table->string('custom_unit')->nullable()->after('unit');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'custom_unit')) {
                $table->dropColumn('custom_unit');
            }

            if (Schema::hasColumn('products', 'unit')) {
                $table->dropColumn('unit');
            }
        });
    }
};