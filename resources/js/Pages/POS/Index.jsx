import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Index({ products }) {
    const { addToast } = useToast();
    const { errors } = usePage().props;
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);

    const addToCart = (product, unit) => {
        const existingItem = cart.find((item) => item.product_id === product.id && item.unit_id === unit.id);
        if (existingItem) {
            const nextCart = cart.map((item) =>
                item.product_id === product.id && item.unit_id === unit.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
            );
            setCart(nextCart);
            return;
        }

        setCart([
            ...cart,
            {
                product_id: product.id,
                name: product.name,
                unit_id: unit.id,
                unit_name: unit.unit_name,
                price: product.retail_price,
                conversion_factor: unit.conversion_factor,
                quantity: 1,
            },
        ]);
    };

    const removeFromCart = (indexToRemove) => {
        setCart(cart.filter((_, index) => index !== indexToRemove));
    };

    const setQuantity = (index, value) => {
        const nextCart = [...cart];
        const parsedValue = Number(value);
        nextCart[index].quantity = Number.isFinite(parsedValue) && parsedValue >= 1 ? parsedValue : 1;
        setCart(nextCart);
    };

    const setItemPrice = (index, value) => {
        const nextCart = [...cart];
        const parsedValue = Number(value);
        nextCart[index].price = Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
        setCart(nextCart);
    };

    const updateQuantity = (index, delta) => {
        setQuantity(index, cart[index].quantity + delta);
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
    };

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).filter(Boolean);
            if (errorMessages.length > 0) {
                addToast(errorMessages[0], 'error');
            }
        }
    }, [errors, addToast]);

    const filteredProducts = products.filter((product) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;

        return `${product.name} ${product.sku}`.toLowerCase().includes(query);
    });

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = Math.max(0, subtotal - discount);

    const handleCheckout = () => {
        if (cart.length === 0) {
            addToast('Cart is empty!', 'error');
            return;
        }

        router.post(
            '/checkout',
            {
                items: cart,
                total: totalAmount,
                discount,
            },
            {
                onSuccess: () => {
                    setCart([]);
                    setDiscount(0);
                    router.reload({ only: ['products'] });
                    addToast('Sale completed successfully!', 'success');
                },
            },
        );
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold">POS Terminal</h2>}>
            <Head title="POS" />
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
                    <div className="lg:w-2/3">
                        <h1 className="mb-4 text-3xl font-bold">POS System</h1>
                        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Search products</label>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or SKU"
                                className="w-full rounded-md border-gray-300"
                            />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredProducts.map((product) => {
                                const units = product.units?.length ? product.units : [
                                    {
                                        id: `default-${product.id}`,
                                        unit_name: product.unit || product.custom_unit || 'پیکٹ',
                                        conversion_factor: 1,
                                    },
                                ];

                                return (
                                    <div key={product.id} className="rounded-lg bg-white p-4 shadow-sm">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div>
                                                <h2 className="font-semibold">{product.name}</h2>
                                                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                                <p className="text-sm text-gray-600">Stock: {product.stock_quantity}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-green-700">{formatCurrency(product.retail_price)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {units.map((unit) => (
                                                <button
                                                    key={unit.id}
                                                    onClick={() => addToCart(product, unit)}
                                                    className="w-full rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                                                >
                                                    Add {unit.unit_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow-sm lg:w-1/3">
                        <h2 className="mb-4 border-b pb-2 text-xl font-bold">Current Bill</h2>
                        <div className="mb-4 flex items-center gap-2">
                            <label className="text-sm font-medium">Discount</label>
                            <input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-full rounded-md border-gray-300"
                            />
                        </div>
                        <button onClick={clearCart} className="mb-4 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Clear cart
                        </button>
                        <div className="flex-grow overflow-y-auto">
                            {cart.map((item, index) => (
                                <div key={`${item.product_id}-${item.unit_id}`} className="border-b py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-sm text-gray-500">{item.unit_name}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="rounded px-2 text-red-500 hover:bg-red-100"
                                        >
                                            X
                                        </button>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(index, -1)}
                                                    className="rounded border px-2"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => setQuantity(index, e.target.value)}
                                                    className="w-16 rounded border-gray-300 text-center"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(index, 1)}
                                                    className="rounded border px-2"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Price</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.price}
                                                onChange={(e) => setItemPrice(index, e.target.value)}
                                                className="w-full rounded border-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <div className="mb-2 flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="mb-2 flex justify-between text-sm">
                                <span>Discount</span>
                                <span>-{formatCurrency(discount)}</span>
                            </div>
                            <div className="mb-4 flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(totalAmount)}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="w-full rounded-lg bg-green-600 px-3 py-3 font-bold text-white hover:bg-green-700"
                            >
                                Complete Sale
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}