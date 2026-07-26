import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import { useToast } from '@/Components/ToastProvider';

export default function Index({ products }) {
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        sku: '',
        stock_quantity: '', // only used/sent when editing an existing product
        unit: 'kg',
        custom_unit: '',
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        clearErrors();
        setEditingProduct(product);
        setData({
            name: product.name,
            sku: product.sku,
            stock_quantity: product.stock_quantity,
            unit: product.unit || '',
            custom_unit: product.custom_unit || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingProduct) {
            put(`/products/${editingProduct.id}`, {
                onSuccess: () => {
                    closeModal();
                    addToast('Product updated successfully.', 'success');
                },
            });
        } else {
            post('/products', {
                onSuccess: () => {
                    closeModal();
                    addToast('Product created successfully.', 'success');
                },
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            destroy(`/products/${id}`, {
                onSuccess: () => addToast('Product deleted successfully.', 'success'),
                onError: () => addToast('Cannot delete product. It has existing sales/purchases.', 'error'),
            });
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Product Management</h2>}>
            <Head title="Products" />
            <div className="p-6">
                <div className="mx-auto max-w-7xl rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Inventory Items</h1>
                        <PrimaryButton onClick={openCreateModal}>Add New Product</PrimaryButton>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-100 text-gray-800">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Unit</th>
                                    <th className="p-3">Stock Qty</th>
                                    <th className="p-3">Moving Avg Price</th>
                                    <th className="p-3">Retail Price</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b">
                                        <td className="p-3 font-semibold text-gray-800">{product.name}</td>
                                        <td className="p-3">{product.sku}</td>
                                        <td className="p-3">{product.custom_unit || product.unit}</td>
                                        <td className="p-3 font-bold text-blue-600">{product.stock_quantity}</td>
                                        <td className="p-3">Rs {product.cost_price}</td>
                                        <td className="p-3 text-green-600 font-semibold">Rs {product.retail_price}</td>
                                        <td className="p-3 text-right space-x-2">
                                            <SecondaryButton onClick={() => openEditModal(product)}>Edit</SecondaryButton>
                                            <DangerButton onClick={() => handleDelete(product.id)}>Del</DangerButton>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-6 text-center text-gray-500">No products found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="xl">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-lg font-bold mb-4">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h2>

                    {!editingProduct && (
                        <p className="mb-4 text-xs text-gray-500">
                            Stock, moving average price, and retail price all start at 0 and are set from Purchase records — they aren't entered here.
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <InputLabel htmlFor="name" value="Product Name" />
                            <TextInput id="name" type="text" className="mt-1 block w-full" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="sku" value="SKU (Barcode/Identifier)" />
                            <TextInput id="sku" type="text" className="mt-1 block w-full" value={data.sku} onChange={(e) => setData('sku', e.target.value)} required />
                            <InputError message={errors.sku} className="mt-2" />
                        </div>

                        {editingProduct && (
                            <div>
                                <InputLabel htmlFor="stock_quantity" value="Stock Quantity (Manual Adjustment)" />
                                <TextInput
                                    id="stock_quantity"
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full"
                                    value={data.stock_quantity}
                                    onChange={(e) => setData('stock_quantity', e.target.value)}
                                    required
                                />
                                <InputError message={errors.stock_quantity} className="mt-2" />
                                <p className="mt-1 text-xs text-amber-600">
                                    Manually overriding stock bypasses Purchase/Sale history — use only for corrections.
                                </p>
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="unit" value="Standard Unit" />
                            <select
                                id="unit"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.unit}
                                onChange={(e) => setData('unit', e.target.value)}
                            >
                                <option value="kg">Kilogram (kg)</option>
                                <option value="g">Gram (g)</option>
                                <option value="ltr">Liter (ltr)</option>
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="custom">Custom...</option>
                            </select>
                            <InputError message={errors.unit} className="mt-2" />
                        </div>

                        {data.unit === 'custom' && (
                            <div>
                                <InputLabel htmlFor="custom_unit" value="Custom Unit Name" />
                                <TextInput id="custom_unit" type="text" className="mt-1 block w-full" value={data.custom_unit} onChange={(e) => setData('custom_unit', e.target.value)} placeholder="e.g. پیکٹ" />
                                <InputError message={errors.custom_unit} className="mt-2" />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}