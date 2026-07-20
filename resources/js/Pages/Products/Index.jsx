import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ products }) {
    const { addToast } = useToast();
    const [form, setForm] = useState({
        name: '',
        sku: '',
        cost_price: '',
        retail_price: '',
        stock_quantity: 0,
        unit: '',
        custom_unit: '',
    });

    const getUnitDisplay = (product) => {
        const unit = product.unit?.trim();
        const customUnit = product.custom_unit?.trim();

        return unit || customUnit || '—';
    };

    const submit = (e) => {
        e.preventDefault();
        router.post('/products', form, {
            onSuccess: () => {
                setForm({ name: '', sku: '', cost_price: '', retail_price: '', stock_quantity: 0, unit: '', custom_unit: '' });
                addToast('Product saved successfully', 'success');
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Products</h2>}>
            <Head title="Products" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Add Product</h3>
                        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Name</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border-gray-300" style={{ fontFamily: 'Noto Nastaliq Urdu, Arial, sans-serif' }} required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">SKU</label>
                                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-md border-gray-300" style={{ fontFamily: 'Noto Nastaliq Urdu, Arial, sans-serif' }} required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Cost Price</label>
                                <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Retail Price</label>
                                <input type="number" step="0.01" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} className="w-full rounded-md border-gray-300" required />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Opening Stock</label>
                                <input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} className="w-full rounded-md border-gray-300" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Unit</label>
                                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value, custom_unit: '' })} className="w-full rounded-md border-gray-300" style={{ fontFamily: 'Noto Nastaliq Urdu, Arial, sans-serif' }}>
                                    <option value="">منتخب کریں</option>
                                    <option value="گرام">گرام</option>
                                    <option value="کلو">کلو</option>
                                    <option value="پیکٹ">پیکٹ</option>
                                    <option value="بکس">بکس</option>
                                    <option value="کاؤنٹ">کاؤنٹ</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Other Unit</label>
                                <input value={form.custom_unit} onChange={(e) => setForm({ ...form, custom_unit: e.target.value, unit: '' })} className="w-full rounded-md border-gray-300" style={{ fontFamily: 'Noto Nastaliq Urdu, Arial, sans-serif' }} placeholder="مثلاً: ڈبہ" />
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save Product</button>
                            </div>
                        </form>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold">Existing Products</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">SKU</th>
                                        <th className="px-4 py-2 text-left">Cost</th>
                                        <th className="px-4 py-2 text-left">Retail</th>
                                        <th className="px-4 py-2 text-left">Unit</th>
                                        <th className="px-4 py-2 text-left">Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td className="px-4 py-2">{product.name}</td>
                                            <td className="px-4 py-2">{product.sku}</td>
                                            <td className="px-4 py-2">{product.cost_price}</td>
                                            <td className="px-4 py-2">{product.retail_price}</td>
                                            <td className="px-4 py-2">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-700">
                                                    {getUnitDisplay(product)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{product.stock_quantity}</td>
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
