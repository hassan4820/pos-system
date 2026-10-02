import { useState } from 'react';

export default function AddToCartForm({ product, unit, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const unitPrice = Number(product.retail_price) * Number(unit.conversion_factor || 1);
    const [calculatedPrice, setCalculatedPrice] = useState(unitPrice);
    const outOfStock = Number(product.stock_quantity) <= 0;

    const handleQuantityChange = (event) => {
        const qty = Number.parseFloat(event.target.value);
        if (Number.isNaN(qty)) {
            setQuantity('');
            setCalculatedPrice('');
            return;
        }

        setQuantity(qty);
        setCalculatedPrice(qty * unitPrice);
    };

    const handlePriceChange = (event) => {
        const priceInput = Number.parseFloat(event.target.value);
        if (Number.isNaN(priceInput)) {
            setCalculatedPrice('');
            setQuantity('');
            return;
        }

        setCalculatedPrice(priceInput);
        setQuantity(unitPrice > 0 ? Number((priceInput / unitPrice).toFixed(3)) : 0);
    };

    const submitToCart = () => {
        const qty = Number.parseFloat(quantity);
        const normalizedQuantity = Math.round((qty + Number.EPSILON) * 1000) / 1000;
        if (!Number.isFinite(qty) || normalizedQuantity < 0.001 || outOfStock) return;

        if (onAddToCart(product, unit, normalizedQuantity)) {
            setQuantity(1);
            setCalculatedPrice(unitPrice);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">Sell by {unit.unit_name}</span>
                {Number(unit.conversion_factor) > 1 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">×{unit.conversion_factor} · Rs {unitPrice.toFixed(2)} / unit</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Quantity
                    <input type="number" min="1" step="1" value={quantity} onChange={handleQuantityChange} className="mt-1 w-full rounded-lg border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium normal-case tracking-normal text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-emerald-500" />
                </label>
                <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Line price
                    <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500">
                        <span className="pl-2.5 text-[10px] normal-case tracking-normal text-slate-400">Rs</span>
                        <input type="number" min="0" step="1" value={calculatedPrice} onChange={handlePriceChange} className="w-full border-0 bg-transparent px-2 py-2 text-xs font-medium normal-case tracking-normal text-slate-800 focus:ring-0" />
                    </div>
                </label>
            </div>
            <button type="button" onClick={submitToCart} disabled={outOfStock} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                <span className="text-base leading-none">+</span>{outOfStock ? 'Unavailable' : 'Add to sale'}
            </button>
        </div>
    );
}
