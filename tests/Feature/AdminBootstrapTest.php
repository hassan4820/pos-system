<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBootstrapTest extends TestCase
{
    use RefreshDatabase;

    public function test_cli_command_creates_an_admin_without_default_credentials(): void
    {
        $this->artisan('app:create-admin')
            ->expectsQuestion('Administrator name', 'Store Admin')
            ->expectsQuestion('Administrator email', 'ADMIN@example.com')
            ->expectsQuestion('Password (minimum 12 characters, mixed case, number and symbol)', 'Strong-Password-123!')
            ->expectsQuestion('Confirm password', 'Strong-Password-123!')
            ->expectsOutput('Administrator account ready for admin@example.com.')
            ->assertExitCode(0);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@example.com',
            'is_admin' => true,
            'role' => 1,
        ]);
        $this->assertTrue(password_verify('Strong-Password-123!', User::where('email', 'admin@example.com')->firstOrFail()->password));
    }
}
