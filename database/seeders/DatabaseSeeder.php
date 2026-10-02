<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Keep normal seeding safe: no default credentials or fake sales are created.
     * Create an administrator with `php artisan app:create-admin`.
     * Demo records can be loaded explicitly with DemoSalesSeeder when needed.
     */
    public function run(): void
    {
        // Intentionally empty.
    }
}
