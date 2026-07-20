import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Users({ users }) {
    const { addToast } = useToast();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_admin: false,
        role: 2,
    });

    const submit = (e) => {
        e.preventDefault();
        router.post('/admin/users', form, {
            onSuccess: () => {
                setForm({ name: '', email: '', password: '', password_confirmation: '', is_admin: false, role: 2 });
                addToast('User created successfully', 'success');
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Admin Users</h2>}>
            <Head title="Admin Users" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Create New User</h3>
                        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Password</label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                                <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="inline-flex items-center gap-2">
                                    <input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked, role: e.target.checked ? 1 : 2 })} />
                                    <span>Admin user</span>
                                </label>
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Role</label>
                                <select value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value), is_admin: Number(e.target.value) === 1 })} className="w-full rounded-md border-gray-300">
                                    <option value={1}>Admin (1)</option>
                                    <option value={2}>Staff (2)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Create User</button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Existing Users</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">Email</th>
                                        <th className="px-4 py-2 text-left">Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-2">{user.name}</td>
                                            <td className="px-4 py-2">{user.email}</td>
                                            <td className="px-4 py-2">{user.is_admin ? 'Admin' : 'Staff'} ({user.role ?? 2})</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
