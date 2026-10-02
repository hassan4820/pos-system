import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useToast } from '@/Components/ToastProvider';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import AddToCartForm from '../../Components/AddToCartForm';

export default function Index({ products }) {
    const { addToast } = useToast();
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
        customQuantity = Math.round((Number(customQuantity) + Number.EPSILON) * 1000) / 1000;
        if (!Number.isFinite(customQuantity) || customQuantity < 0.001) return false;

        const conversionFactor = Number(unit.conversion_factor || 1);
        const requestedBaseQuantity = Number(customQuantity) * conversionFactor;
        const cartBaseQuantity = baseQuantityInCart(product.id);
        // Keep the unit identifier in the same format for both lookup and storage.
        // API responses can serialize IDs as strings, while cart items use numbers.
        const resolvedUnitId =
            typeof unit.id === 'number' || /^\d+$/.test(String(unit.id)) ? Number(unit.id) : null;

        if (cartBaseQuantity + requestedBaseQuantity > Number(product.stock_quantity)) {
            addToast(`${product.name} is out of stock or does not have enough stock available.`, 'error');
            return false;
        }

        // Find the existing product/unit line. Comparing a normalized ID prevents
        // duplicate cart keys, which makes React render the wrong row contents.
        const existingItemIndex = cart.findIndex(
            (item) => item.product_id === product.id && item.unit_id === resolvedUnitId
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
        setCart([
            {
                product_id: product.id,
                name: product.name,
                unit_id: resolvedUnitId,
                unit_name: unit.unit_name,
                conversion_factor: conversionFactor,
                price: Number(product.retail_price) * conversionFactor,
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
        const nextQuantity = Number.isFinite(parsedValue) && parsedValue >= 0.001
            ? Math.round((parsedValue + Number.EPSILON) * 1000) / 1000
            : 0.001;
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
        nextCart[index].price = Number.isFinite(parsedValue) && parsedValue >= 0
            ? Math.round((parsedValue + Number.EPSILON) * 100) / 100
            : 0;
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

    const subtotalCents = cart.reduce((sum, item) => (
        sum + Math.round((Number(item.price) * Number(item.quantity) + Number.EPSILON) * 100)
    ), 0);
    const subtotal = subtotalCents / 100;
    const maxDiscountCents = 9999999999;
    const discountCents = Math.min(subtotalCents, maxDiscountCents, Math.max(0, Math.round((Number(discount) + Number.EPSILON) * 100)));
    const appliedDiscount = discountCents / 100;
    const totalAmount = (subtotalCents - discountCents) / 100;

    useEffect(() => {
        setDiscount((currentDiscount) => Math.min(
            Math.min(maxDiscountCents, Math.max(0, Math.round((Number(currentDiscount) + Number.EPSILON) * 100))) / 100,
            subtotal,
        ));
    }, [subtotal]);

    const handleCheckout = () => {
        if (cart.length === 0) {
            addToast('Cart is empty!', 'error');
            return;
        }

        router.post(
            route('checkout.store'),
            {
                items: cart.map(({ product_id, quantity, price, unit_id }) => ({
                    product_id,
                    quantity,
                    price,
                    unit_id,
                })),
                discount: appliedDiscount,
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
        <AuthenticatedLayout>
            <Head title="Point of sale" />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Sales desk</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Point of sale</h1>
                        <p className="mt-1 text-sm text-slate-500">Find products, build a bill, and complete a sale.</p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />{products.length} products available
                    </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
                    <section className="min-w-0 space-y-4">
                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] md:p-5">
                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search catalogue</span>
                                <span className="relative block">
                                    <svg className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search product name or SKU" className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500" />
                                </span>
                            </label>
                            <form onSubmit={handleBarcodeSubmit} className="block">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="barcode-input">Quick scan</label>
                                <span className="flex gap-2">
                                    <input id="barcode-input" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan barcode and press Enter" className="min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50 px-3 py-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500" />
                                    <button type="submit" className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700">Add</button>
                                </span>
                            </form>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-semibold text-slate-800">Product catalogue</h2>
                            <span className="text-xs text-slate-500">{filteredProducts.length} shown</span>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg></span>
                                <h3 className="mt-4 text-sm font-semibold text-slate-800">No products found</h3>
                                <p className="mt-1 text-sm text-slate-500">Try another name or SKU.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                {filteredProducts.map((product) => {
                                    const units = product.units?.length ? product.units : [{
                                        id: `default-${product.id}`,
                                        unit_name: product.unit || product.custom_unit || 'پیکٹ',
                                        conversion_factor: 1,
                                    }];
                                    const outOfStock = Number(product.stock_quantity) <= 0;

                                    return (
                                        <article key={product.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${outOfStock ? 'border-rose-200' : 'border-slate-200'}`}>
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
                                                        <p className="mt-1 text-xs font-medium tracking-wide text-slate-400">SKU {product.sku}</p>
                                                    </div>
                                                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm font-bold text-emerald-700">{formatCurrency(product.retail_price)}</span>
                                                </div>
                                                <div className="mt-3">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${outOfStock ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${outOfStock ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                                        {outOfStock ? 'Out of stock' : `${product.stock_quantity} in stock`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 p-3">
                                                {units.map((unit) => <AddToCartForm key={unit.id} product={product} unit={unit} onAddToCart={addToCart} />)}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <aside className="xl:sticky xl:top-[88px]">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="font-bold text-slate-900">Current sale</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">{cart.length} {cart.length === 1 ? 'line item' : 'line items'}</p>
                                </div>
                                {cart.length > 0 && <button type="button" onClick={clearCart} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600">Clear sale</button>}
                            </div>

                            <div className="max-h-[min(48vh,480px)] min-h-[180px] overflow-y-auto px-5">
                                {cart.length === 0 ? (
                                    <div className="flex min-h-[180px] flex-col items-center justify-center py-8 text-center">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-1.5 9h-13L4 5Z" /><path d="M4 5 3 3H1" /><circle cx="8" cy="19" r="1" /><circle cx="17" cy="19" r="1" /></svg></span>
                                        <p className="mt-3 text-sm font-semibold text-slate-700">Your sale is empty</p>
                                        <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-500">Choose a product or scan a barcode to add an item.</p>
                                    </div>
                                ) : cart.map((item, index) => (
                                    <div key={`${item.product_id}-${item.unit_id}`} className="border-b border-slate-100 py-4 last:border-b-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                                                <p className="mt-0.5 text-xs text-slate-500">{item.unit_name}</p>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(index)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${item.name}`}>
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>
                                            </button>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-2">
                                            <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white">
                                                <button type="button" onClick={() => updateQuantity(index, -1)} className="h-full px-2.5 text-slate-500 hover:text-slate-900" aria-label="Decrease quantity">−</button>
                                                <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => setQuantity(index, event.target.value)} className="h-full w-12 border-0 p-0 text-center text-xs font-semibold text-slate-800 focus:ring-0" aria-label={`Quantity for ${item.name}`} />
                                                <button type="button" onClick={() => updateQuantity(index, 1)} className="h-full px-2.5 text-slate-500 hover:text-slate-900" aria-label="Increase quantity">+</button>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{formatCurrency(Math.round((Number(item.price) * Number(item.quantity) + Number.EPSILON) * 100) / 100)}</span>
                                        </div>
                                        <label className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                                            <span>Unit price</span>
                                            <span className="flex items-center gap-1">Rs <input type="number" min="0" step="1" value={item.price} onChange={(event) => setItemPrice(index, event.target.value)} className="w-20 rounded-md border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-medium text-slate-700 focus:border-emerald-500 focus:ring-emerald-500" aria-label={`Price for ${item.name}`} /></span>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                                <label className="mb-4 flex items-center justify-between gap-4 text-sm">
                                    <span className="font-medium text-slate-600">Discount</span>
                                    <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-400">Rs <input type="number" min="0" max={Math.min(subtotal, 99999999.99)} step="1" value={appliedDiscount} onChange={(event) => setDiscount(Math.min(subtotal, 99999999.99, Math.max(0, Number(event.target.value))))} className="w-24 border-0 py-2 text-right text-sm font-semibold text-slate-800 focus:ring-0" aria-label="Discount amount" /></span>
                                </label>
                                <div className="space-y-2 border-t border-dashed border-slate-200 pt-3 text-sm">
                                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between text-slate-500"><span>Discount</span><span>−{formatCurrency(appliedDiscount)}</span></div>
                                </div>
                                <div className="mt-3 flex items-end justify-between">
                                    <span className="text-sm font-semibold text-slate-700">Total due</span>
                                    <span className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalAmount)}</span>
                                </div>
                                <button type="button" onClick={handleCheckout} disabled={cart.length === 0} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-950 shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
                                    Complete sale <span aria-hidden="true">→</span>
                                </button>
                                <p className="mt-3 text-center text-[11px] text-slate-400">Review items and discount before completing.</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
