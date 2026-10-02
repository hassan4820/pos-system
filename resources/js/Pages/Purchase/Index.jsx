import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useToast } from '@/Components/ToastProvider';

export default function Index({ products }) {
    const { addToast } = useToast();
    const [inventorySearch, setInventorySearch] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        quantity: '',
        cost_price: '',
        retail_price: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post('/purchase', {
            onSuccess: () => {
                reset();
                addToast('Stock purchased successfully! Average cost updated.', 'success');
            },
        });
    };

    // Find the currently selected product to show hints
    const selectedProduct = products.find(p => p.id === parseInt(data.product_id));
    const filteredProducts = useMemo(() => {
        const query = inventorySearch.trim().toLowerCase();

        if (!query) return products;

        return products.filter((product) =>
            `${product.name} ${product.sku}`.toLowerCase().includes(query),
        );
    }, [inventorySearch, products]);
    const totalAssetValue = products.reduce(
        (total, product) => total + (Number(product.stock_quantity) * Number(product.cost_price)),
        0,
    );
    const selectForRestock = (product) => {
        setData('product_id', String(product.id));
        document.getElementById('product_id')?.focus();
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Inventory Purchase</h2>}>
            <Head title="Purchases" />
            <div className="p-6">
                <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Purchase Entry Form */}
                    <div className="md:col-span-1 rounded-lg bg-white p-6 shadow-sm h-fit">
                        <h2 className="text-lg font-bold mb-4">Record New Stock</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="product_id" value="Select Product" />
                                <select
                                    id="product_id"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.product_id}
                                    onChange={(e) => setData('product_id', e.target.value)}
                                    required
                                >
                                    <option value="" disabled>-- Choose Product --</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} (SKU: {product.sku})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.product_id} className="mt-2" />
                            </div>

                            {selectedProduct && (
                                <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
                                    Current Stock: <strong>{selectedProduct.stock_quantity} {selectedProduct.custom_unit || selectedProduct.unit}</strong> <br />
                                    Current Avg Cost: <strong>Rs {selectedProduct.cost_price}</strong> <br />
                                    Current Retail Price: <strong>Rs {selectedProduct.retail_price}</strong>
                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="quantity" value="Quantity Purchased" />
                                <TextInput
                                    id="quantity"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    required
                                />
                                <InputError message={errors.quantity} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="cost_price" value="New Purchase Price (Per Unit)" />
                                <TextInput
                                    id="cost_price"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.cost_price}
                                    onChange={(e) => setData('cost_price', e.target.value)}
                                    required
                                />
                                <InputError message={errors.cost_price} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="retail_price" value="Retail Price (Selling Price)" />
                                <TextInput
                                    id="retail_price"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.retail_price}
                                    onChange={(e) => setData('retail_price', e.target.value)}
                                    required
                                />
                                <InputError message={errors.retail_price} className="mt-2" />
                            </div>

                            <PrimaryButton className="w-full justify-center" disabled={processing}>
                                Complete Purchase
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* Current Inventory Overview */}
                    <div className="md:col-span-2 rounded-lg bg-white p-6 shadow-sm">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Current Inventory Status</h2>
                                <p className="text-sm text-gray-600">Available total asset value: <span className="font-bold text-green-700">Rs {totalAssetValue.toFixed(2)}</span></p>
                            </div>
                            <input
                                type="search"
                                value={inventorySearch}
                                onChange={(event) => setInventorySearch(event.target.value)}
                                placeholder="Search item or barcode/SKU"
                                className="w-full rounded-md border-gray-300 sm:w-72"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-100 text-gray-800">
                                    <tr>
                                        <th className="p-3">Product Name</th>
                                        <th className="p-3">Available Stock</th>
                                        <th className="p-3">Moving Avg Cost</th>
                                        <th className="p-3 text-right">Total Asset Value</th>
                                        <th className="p-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => {
                                        const assetValue = (parseFloat(product.stock_quantity) * parseFloat(product.cost_price)).toFixed(2);
                                        const outOfStock = Number(product.stock_quantity) <= 0;
                                        return (
                                            <tr key={product.id} className={`border-b ${outOfStock ? 'bg-red-50' : ''}`}>
                                                <td className="p-3 font-semibold text-gray-800">{product.name}</td>
                                                <td className={`p-3 ${outOfStock ? 'font-bold text-red-700' : ''}`}>
                                                    {outOfStock ? 'Out of stock' : `${product.stock_quantity} ${product.custom_unit || product.unit}`}
                                                </td>
                                                <td className="p-3 text-green-700">Rs {product.cost_price}</td>
                                                <td className="p-3 text-right font-bold">Rs {assetValue}</td>
                                                <td className="p-3 text-right">
                                                    {outOfStock && (
                                                        <button
                                                            type="button"
                                                            onClick={() => selectForRestock(product)}
                                                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                                        >
                                                            Restock
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProducts.length === 0 && (
                                        <tr><td colSpan="5" className="p-6 text-center text-gray-500">No matching inventory item found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
