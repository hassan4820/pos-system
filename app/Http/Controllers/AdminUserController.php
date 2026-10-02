<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index()
    {
        $this->authorizeAdmin();

        return Inertia::render('Admin/Users', [
            'users' => User::where('is_admin', false)->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => false,
            'role' => 2,
        ]);

        return redirect()->route('admin.users')->with('success', 'User created successfully.');
    }

    private function authorizeAdmin(): void
    {
        if (!auth()->check() || !auth()->user()->is_admin) {
            abort(403);
        }
    }
}
