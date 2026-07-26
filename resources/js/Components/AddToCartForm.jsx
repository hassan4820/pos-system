import React, { useState } from 'react';

export default function AddToCartForm({ product, unit, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [calculatedPrice, setCalculatedPrice] = useState(product.retail_price);

    const handleQuantityChange = (e) => {
        const qty = parseFloat(e.target.value);
        if (isNaN(qty)) {
            setQuantity('');
            setCalculatedPrice('');
            return;
        }
        setQuantity(qty);
        setCalculatedPrice(qty * product.retail_price);
    };

    const handlePriceChange = (e) => {
        const priceInput = parseFloat(e.target.value);
        if (isNaN(priceInput)) {
            setCalculatedPrice('');
            setQuantity('');
            return;
        }
        setCalculatedPrice(priceInput);
        setQuantity(parseFloat((priceInput / product.retail_price).toFixed(3)));
    };

    const submitToCart = () => {
        const qty = parseFloat(quantity);
        if (!Number.isFinite(qty) || qty < 0.01) {
            return;
        }
        onAddToCart(product, unit, qty);
        
        // Reset inputs back to default after adding
        setQuantity(1);
        setCalculatedPrice(product.retail_price);
    };

    return (
        <div className="p-3 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
            <p className="text-sm font-semibold mb-2 text-gray-700">Sell by {unit.unit_name}</p>
            
            <div className="flex gap-2 mb-3">
                <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Qty ({unit.unit_name})</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={quantity} 
                        onChange={handleQuantityChange} 
                        className="w-full rounded border-gray-300 text-sm px-2 py-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Price (Rs)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        value={calculatedPrice} 
                        onChange={handlePriceChange} 
                        className="w-full rounded border-gray-300 text-sm px-2 py-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                </div>
            </div>
            
            <button 
                onClick={submitToCart} 
                className="w-full rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
            >
                Add to Cart
            </button>
        </div>
    );
}