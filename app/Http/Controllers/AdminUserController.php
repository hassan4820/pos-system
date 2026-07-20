<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminUserController extends Controller
{
    public function index()
    {
        $this->authorizeAdmin();

        return Inertia::render('Admin/Users', [
            'users' => User::latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'is_admin' => 'nullable|boolean',
            'role' => 'nullable|integer|min:1|max:2',
        ]);

        $isAdmin = (bool) ($validated['is_admin'] ?? false);
        $role = $isAdmin ? 1 : ((int) ($validated['role'] ?? 2));

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => $isAdmin,
            'role' => $role,
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
