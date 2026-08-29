import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import AddToCartForm from '../../Components/AddToCartForm';

export default function Index({ products }) {
    const { addToast } = useToast();
    const { errors } = usePage().props;
    const [cart, setCart] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [barcode, setBarcode] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // New state

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
        }).format(amount);

    const baseQuantityInCart = (productId, excludingIndex = null) => cart.reduce((total, item, index) => {
        if (item.product_id === productId && index !== excludingIndex) {
            return total + (Number(item.quantity) * Number(item.conversion_factor || 1));
        }

        return total;
    }, 0);

    const addToCart = (product, unit, customQuantity = 1) => {
        const conversionFactor = Number(unit.conversion_factor || 1);
        const requestedBaseQuantity = Number(customQuantity) * conversionFactor;
        const cartBaseQuantity = baseQuantityInCart(product.id);

        if (cartBaseQuantity + requestedBaseQuantity > Number(product.stock_quantity)) {
            addToast(`${product.name} is out of stock or does not have enough stock available.`, 'error');
            return false;
        }

        // Find the index of the item instead of just checking if it exists
        const existingItemIndex = cart.findIndex(
            (item) => item.product_id === product.id && item.unit_id === unit.id
        );

        if (existingItemIndex > -1) {
            // Item exists: extract it, update the quantity, and push it to the top
            const nextCart = cart.map((item, index) => index === existingItemIndex
                ? { ...item, quantity: Number(item.quantity) + Number(customQuantity) }
                : item,
            );
            const [itemToUpdate] = nextCart.splice(existingItemIndex, 1);
            setCart([itemToUpdate, ...nextCart]);
            return true;
        }

        // New item: place the new object first, then spread the existing cart array after it
        const resolvedUnitId =
            typeof unit.id === 'number' || /^\d+$/.test(String(unit.id)) ? Number(unit.id) : null;

        setCart([
            {
                product_id: product.id,
                name: product.name,
                unit_id: resolvedUnitId,
                unit_name: unit.unit_name,
                conversion_factor: conversionFactor,
                price: product.retail_price,
                quantity: customQuantity,
            },
            ...cart,
        ]);
        return true;
    };

    const removeFromCart = (indexToRemove) => {
        setCart(cart.filter((_, index) => index !== indexToRemove));
    };

    const setQuantity = (index, value) => {
        const parsedValue = Number(value);
        const nextQuantity = Number.isFinite(parsedValue) && parsedValue >= 0.01 ? parsedValue : 0.01;
        const item = cart[index];
        const product = products.find((candidate) => candidate.id === item.product_id);

        if (product && baseQuantityInCart(item.product_id, index) + (nextQuantity * Number(item.conversion_factor || 1)) > Number(product.stock_quantity)) {
            addToast(`${product.name} does not have enough stock available.`, 'error');
            return;
        }

        setCart(cart.map((cartItem, cartIndex) => cartIndex === index
            ? { ...cartItem, quantity: nextQuantity }
            : cartItem,
        ));
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

    // Debounce the search input to prevent UI freezing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredProducts = useMemo(() => {
        const query = debouncedSearchTerm.trim().toLowerCase();

        // If no search, only render the first 50 products to prevent DOM overload
        if (!query) return products.slice(0, 50);

        // Filter and limit results
        return products
            .filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query))
            .slice(0, 50);
    }, [debouncedSearchTerm, products]);

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
                items: cart.map(({ product_id, quantity, price, unit_id }) => ({
                    product_id,
                    quantity,
                    price,
                    unit_id,
                })),
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

    const handleBarcodeSubmit = (event) => {
        event.preventDefault();
        const scannedCode = barcode.trim().toLowerCase();
        const product = products.find((candidate) => candidate.sku?.toLowerCase() === scannedCode);

        if (!product) {
            addToast('No product matches this barcode/SKU.', 'error');
            return;
        }

        const unit = product.units?.[0] || {
            id: `default-${product.id}`,
            unit_name: product.unit || product.custom_unit || 'Unit',
            conversion_factor: 1,
        };
        if (addToCart(product, unit)) setBarcode('');
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
                        <form onSubmit={handleBarcodeSubmit} className="mb-4 rounded-lg bg-white p-4 shadow-sm">
                            <label className="mb-2 block text-sm font-medium text-gray-700">Barcode scanner / SKU</label>
                            <div className="flex gap-2">
                                <input
                                    value={barcode}
                                    onChange={(event) => setBarcode(event.target.value)}
                                    placeholder="Scan a barcode, then press Enter"
                                    className="w-full rounded-md border-gray-300"
                                />
                                <button type="submit" className="rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Add</button>
                            </div>
                        </form>
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
                                    <div key={product.id} className={`rounded-lg bg-white p-4 shadow-sm ${Number(product.stock_quantity) <= 0 ? 'ring-1 ring-red-300' : ''}`}>
                                        <div className="mb-3 flex items-start justify-between">
                                            <div>
                                                <h2 className="font-semibold">{product.name}</h2>
                                                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                                <p className={`text-sm ${Number(product.stock_quantity) <= 0 ? 'font-semibold text-red-700' : 'text-gray-600'}`}>
                                                    {Number(product.stock_quantity) <= 0 ? 'Out of stock' : `Stock: ${product.stock_quantity}`}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-green-700">{formatCurrency(product.retail_price)}</span>
                                        </div>
                                        <div className="space-y-2 mt-3">
                                            {units.map((unit) => (
                                                <AddToCartForm
                                                    key={unit.id}
                                                    product={product}
                                                    unit={unit}
                                                    onAddToCart={addToCart}
                                                />
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
