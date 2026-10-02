<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class CreateAdminUser extends Command
{
    protected $signature = 'app:create-admin';

    protected $description = 'Create or promote an administrator account';

    public function handle(): int
    {
        $name = trim($this->ask('Administrator name'));
        $email = Str::lower(trim($this->ask('Administrator email')));

        $validator = Validator::make(
            ['name' => $name, 'email' => $email],
            ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'max:255']],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $password = $this->secret('Password (minimum 12 characters, mixed case, number and symbol)');
        $passwordConfirmation = $this->secret('Confirm password');

        if (!hash_equals((string) $password, (string) $passwordConfirmation)) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        try {
            Validator::make(['password' => $password], [
                'password' => ['required', Password::min(12)->letters()->mixedCase()->numbers()->symbols()],
            ])->validate();
        } catch (ValidationException $exception) {
            foreach ($exception->errors()['password'] ?? [] as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->password = Hash::make($password);
        $user->is_admin = true;
        $user->role = 1;
        $user->save();

        $this->info("Administrator account ready for {$email}.");

        return self::SUCCESS;
    }
}
