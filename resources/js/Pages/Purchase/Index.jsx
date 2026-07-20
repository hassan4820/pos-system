import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ products }) {
    const { addToast } = useToast();
    const [form, setForm] = useState({
        product_id: '',
        quantity: 1,
        cost_price: '',
    });

    const submit = (e) => {
        e.preventDefault();
        router.post('/purchase', form, {
            onSuccess: () => {
                setForm({ product_id: '', quantity: 1, cost_price: '' });
                addToast('Purchase recorded successfully', 'success');
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Inventory Purchase</h2>}>
            <Head title="Purchase" />
            <div className="py-12">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Record stock purchase</h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Product</label>
                                <select
                                    value={form.product_id}
                                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                    className="w-full rounded-md border-gray-300"
                                    required
                                >
                                    <option value="">Select product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        className="w-full rounded-md border-gray-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Cost Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.cost_price}
                                        onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                                        className="w-full rounded-md border-gray-300"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                                Save Purchase
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
